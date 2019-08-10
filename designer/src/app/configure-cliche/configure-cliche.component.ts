import {
  Component,
  ComponentFactoryResolver,
  Inject,
  Injector,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import {
  ErrorStateMatcher,
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material';

import * as _ from 'lodash';
import { ElectronService } from 'ngx-electron';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { Subscribable } from 'rxjs/Observable';

import { AnonymousSubscription } from 'rxjs/Subscription';

import { clicheDefinitions } from '../cliche.module';
import {
  App, ClicheDefinition, ClicheInstance, usedClichesConfig
} from '../datatypes';
import { DynamicComponentDirective } from '../dynamic-component.directive';


export interface DialogData {
  app: App;
  cliche?: ClicheInstance;
}

export interface AfterClosedData {
  event: 'create' | 'delete' | 'update' | 'cancel';
  cliche?: ClicheInstance;
}

interface ControlGroup {
  form: { valid: boolean };
}


class JSONValidator extends ErrorStateMatcher {
  constructor(private icc: ConfigureClicheComponent) {
    super();
  }

  isErrorState(
    control?: FormControl | null,
    form?: FormGroupDirective | NgForm
  ): boolean {
    if (!this.icc.configString) {
      return false;
    }
    if (!this.icc.configString.startsWith('{')) {
      return true;
    }
    try {
      JSON.parse(this.icc.configString);

      return false;
    } catch (e) {
      return true;
    }
  }
}


@Component({
  selector: 'app-configure-cliche',
  templateUrl: './configure-cliche.component.html',
  styleUrls: ['./configure-cliche.component.scss']
})
export class ConfigureClicheComponent implements OnInit {
  @ViewChild(DynamicComponentDirective)
    private readonly configWizardComponentHost: DynamicComponentDirective;
  name: string;
  configString: string;
  readonly jsonValidator: JSONValidator;
  sub: AnonymousSubscription;
  ofControl = new FormControl();
  filteredClicheDefinitionNames: Observable<string[]>;
  clicheDefinitionsMap: {[name: string]: ClicheDefinition};

  constructor(
    private readonly electronService: ElectronService,
    private readonly dialogRef: MatDialogRef<ConfigureClicheComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData,
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly injector: Injector
  ) {
    this.jsonValidator = new JSONValidator(this);
    this.clicheDefinitionsMap = _.keyBy(this.clicheDefinitions, 'name');
  }

  ngOnInit() {
    this.filteredClicheDefinitionNames = this.ofControl.valueChanges
      .pipe(
        startWith(''),
        map((v: string) => this.filterClicheDefinitionNames(v))
      );
    if (this.data.cliche) {
      this.ofControl.setValue(this.data.cliche.of.name);
      this.ofControl.disable();
      this.name = this.data.cliche.name;
      this.configString = JSON.stringify(this.data.cliche.config);
      if (this.getConfigWizard()) {
        this.loadConfigWizard();
      }
    }
  }

  private filterClicheDefinitionNames(value: string): string[] {
    return _.filter(
      _.keys(this.clicheDefinitionsMap),
      (cdn: string) => cdn.toLowerCase()
        .includes(value));
  }

  get clicheDefinitions() {
    return clicheDefinitions;
  }

  get clicheDefinitionNames() {
    return _.keys(this.clicheDefinitionsMap);
  }

  validate(form: ControlGroup) {
    return form.form.valid && !this.jsonValidator.isErrorState() &&
      (this.ofControl.disabled || this.ofControl.valid);
  }

  getConfigWizard() {
    return this.getClicheDefinition().configWizardComponent;
  }

  getClicheDefinition() {
    return this.clicheDefinitionsMap[this.ofControl.value.toLowerCase()];
  }

  onSelectCliche() {
    if (_.isEmpty(this.ofControl.value)) {
      return;
    }
    const validNames = _.map(
      this.clicheDefinitionNames, (cd) => cd.toLowerCase());
    if (!_.includes(validNames, this.ofControl.value.toLowerCase())) {
      this.ofControl.setErrors({ invalidName: true });
    } else {
      this.ofControl.setErrors(null);
      this.ofControl.updateValueAndValidity();
      this.name = this.ofControl.value.toLowerCase();
      this.configString = '';
      if (this.getConfigWizard()) {
        this.loadConfigWizard();
      } else {
        this.clearConfigWizard();
      }
    }
  }

  cancel() {
    this.dialogRef.close({ event: 'cancel' });
  }

  save(form: ControlGroup) {
    if (this.validate(form)) {
      let clicheInstance: ClicheInstance;
      if (this.data.cliche) {
        clicheInstance = this.data.cliche;
        clicheInstance.name = this.name;
        _.forEach(clicheInstance.config, (v, key) => {
          delete clicheInstance.config[key];
        });
      } else {
        clicheInstance = new ClicheInstance(
          this.name, this.getClicheDefinition());
        usedClichesConfig[this.name] = { config: clicheInstance.config };
        this.data.app.cliches.push(clicheInstance);
      }
      if (this.configString) { // guaranteed to be valid JSON of object
        Object.assign(clicheInstance.config, JSON.parse(this.configString));
      }
      this.dialogRef.close({
        event: this.data.cliche ? 'update' : 'create',
        cliche: clicheInstance
      });
    }
  }

  delete() {
    if (window.confirm(
      'Are you sure you want to remove this cliché instance? ' +
      'All of the components of this cliché instance ' +
      'that you are using will be removed as well.'
    )) {
      this.data.app.deleteClicheInstance(this.data.cliche);
      this.dialogRef.close({ event: 'delete', cliche: this.data.cliche });
    }
  }

  help() {
    if (this.electronService.remote) {
      this.electronService.shell
        .openExternal(
          'https://github.com/spderosso/deja-vu/blob/master/packages/' +
          'catalog/README.md');
    }
  }

  private clearConfigWizard(): ViewContainerRef {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
    const { viewContainerRef } = this.configWizardComponentHost;
    viewContainerRef.clear();

    return viewContainerRef;
  }

  private loadConfigWizard() {
    const viewContainerRef = this.clearConfigWizard();
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(<Type<{}>> this.getConfigWizard());
    const componentRef = viewContainerRef.createComponent(
      componentFactory,
      0,
      this.injector
    );
    const changeOutput: Subscribable<string> = componentRef.instance['change'];
    let onThisMicrotask = true;
    if (changeOutput) {
      this.sub = changeOutput.subscribe((config) => {
        if (onThisMicrotask) {
          setTimeout(() => this.configString = config || ' ');
        } else {
          this.configString = config || ' ';
        }
      });
    }
    if (this.data.cliche) {
      componentRef.instance['value'] = this.configString;
    }
    setTimeout(() => onThisMicrotask = false);
  }

}
