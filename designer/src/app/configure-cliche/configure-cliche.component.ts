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
  MatDialogRef,
  MatSelectChange
} from '@angular/material';
import * as _ from 'lodash';
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
  of: ClicheDefinition;
  name: string;
  configString: string;
  readonly jsonValidator: JSONValidator;
  sub: AnonymousSubscription;

  constructor(
    private readonly dialogRef: MatDialogRef<ConfigureClicheComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData,
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly injector: Injector
  ) {
    this.jsonValidator = new JSONValidator(this);
  }

  ngOnInit() {
    if (this.data.cliche) {
      this.of = this.data.cliche.of;
      this.name = this.data.cliche.name;
      this.configString = JSON.stringify(this.data.cliche.config);
      if (this.of.configWizardComponent) {
        this.loadConfigWizard();
      }
    }
  }

  get clicheDefinitions() {
    return clicheDefinitions;
  }

  validate(form: ControlGroup) {
    return form.form.valid && !this.jsonValidator.isErrorState();
  }

  onSelectCliche(event: MatSelectChange) {
    this.name = event.value.name;
    this.configString = '';
    if (this.of.configWizardComponent) {
      this.loadConfigWizard();
    } else {
      this.clearConfigWizard();
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
        clicheInstance = new ClicheInstance(this.name, this.of);
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
      'Are you sure you want to remove this Cliché? ' +
      'Any of its actions that you are using will be removed as well.'
    )) {
      this.data.app.actions.forEach((ad) => {
        ad.rows.forEach((r) => {
          _.remove(r.actions, (ai) => ai.from === this.data.cliche);
        });
      });
      _.remove(this.data.app.cliches, (c) => c === this.data.cliche);
      this.dialogRef.close({ event: 'delete', cliche: this.data.cliche });
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
      .resolveComponentFactory(<Type<{}>>this.of.configWizardComponent);
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
