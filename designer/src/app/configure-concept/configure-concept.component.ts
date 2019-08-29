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

import { conceptDefinitions } from '../concept.module';
import {
  App, ConceptDefinition, ConceptInstance, usedConceptsConfig
} from '../datatypes';
import { DynamicComponentDirective } from '../dynamic-component.directive';


export interface DialogData {
  app: App;
  concept?: ConceptInstance;
}

export interface AfterClosedData {
  event: 'create' | 'delete' | 'update' | 'cancel';
  concept?: ConceptInstance;
}

interface ControlGroup {
  form: { valid: boolean };
}


class JSONValidator extends ErrorStateMatcher {
  constructor(private icc: ConfigureConceptComponent) {
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
  selector: 'app-configure-concept',
  templateUrl: './configure-concept.component.html',
  styleUrls: ['./configure-concept.component.scss']
})
export class ConfigureConceptComponent implements OnInit {
  @ViewChild(DynamicComponentDirective)
    private readonly configWizardComponentHost: DynamicComponentDirective;
  name: string;
  configString: string;
  readonly jsonValidator: JSONValidator;
  sub: AnonymousSubscription;
  ofControl = new FormControl();
  filteredConceptDefinitionNames: Observable<string[]>;
  conceptDefinitionsMap: {[name: string]: ConceptDefinition};

  constructor(
    private readonly electronService: ElectronService,
    private readonly dialogRef: MatDialogRef<ConfigureConceptComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData,
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly injector: Injector
  ) {
    this.jsonValidator = new JSONValidator(this);
    this.conceptDefinitionsMap = _.keyBy(this.conceptDefinitions, 'name');
  }

  ngOnInit() {
    this.filteredConceptDefinitionNames = this.ofControl.valueChanges
      .pipe(
        startWith(''),
        map((v: string) => this.filterConceptDefinitionNames(v))
      );
    if (this.data.concept) {
      this.ofControl.setValue(this.data.concept.of.name);
      this.ofControl.disable();
      this.name = this.data.concept.name;
      this.configString = JSON.stringify(this.data.concept.config);
      if (this.getConfigWizard()) {
        this.loadConfigWizard();
      }
    }
  }

  private filterConceptDefinitionNames(value: string): string[] {
    return _.filter(
      _.keys(this.conceptDefinitionsMap),
      (cdn: string) => cdn.toLowerCase()
        .includes(value));
  }

  get conceptDefinitions() {
    return conceptDefinitions;
  }

  get conceptDefinitionNames() {
    return _.keys(this.conceptDefinitionsMap);
  }

  validate(form: ControlGroup) {
    return form.form.valid && !this.jsonValidator.isErrorState() &&
      (this.ofControl.disabled || this.ofControl.valid);
  }

  getConfigWizard() {
    return this.getConceptDefinition().configWizardComponent;
  }

  getConceptDefinition() {
    return this.conceptDefinitionsMap[this.ofControl.value.toLowerCase()];
  }

  onSelectConcept() {
    if (_.isEmpty(this.ofControl.value)) {
      return;
    }
    const validNames = _.map(
      this.conceptDefinitionNames, (cd) => cd.toLowerCase());
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
      let conceptInstance: ConceptInstance;
      if (this.data.concept) {
        conceptInstance = this.data.concept;
        conceptInstance.name = this.name;
        _.forEach(conceptInstance.config, (v, key) => {
          delete conceptInstance.config[key];
        });
      } else {
        conceptInstance = new ConceptInstance(
          this.name, this.getConceptDefinition());
        usedConceptsConfig[this.name] = { config: conceptInstance.config };
        this.data.app.concepts.push(conceptInstance);
      }
      if (this.configString) { // guaranteed to be valid JSON of object
        Object.assign(conceptInstance.config, JSON.parse(this.configString));
      }
      this.dialogRef.close({
        event: this.data.concept ? 'update' : 'create',
        concept: conceptInstance
      });
    }
  }

  delete() {
    if (window.confirm(
      'Are you sure you want to remove this concept instance? ' +
      'All of the components of this concept instance ' +
      'that you are using will be removed as well.'
    )) {
      this.data.app.deleteConceptInstance(this.data.concept);
      this.dialogRef.close({ event: 'delete', concept: this.data.concept });
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
    if (this.data.concept) {
      componentRef.instance['value'] = this.configString;
    }
    setTimeout(() => onThisMicrotask = false);
  }

}
