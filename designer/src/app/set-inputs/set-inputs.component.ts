import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog, MatMenuTrigger } from '@angular/material';
import * as _ from 'lodash';

import { ComponentInstance, App, AppComponentDefinition } from '../datatypes';
import {
  DialogData as TextDialogData,
  TextComponent
} from '../text/text.component';

import compileDvExpr from '../expression.compiler';

@Component({
  selector: 'app-set-inputs',
  templateUrl: './set-inputs.component.html',
  styleUrls: ['./set-inputs.component.scss']
})
export class SetInputsComponent implements OnChanges {
  @Input() app: App;
  @Input() componentInstance: ComponentInstance;
  @Input() openComponent: AppComponentDefinition;
  @Input() context = '';

  expressionInputs: string[];
  componentInputs: string[];
  componentInputsIODescriptions: {
    [componentInputName: string]: { [ioName: string]: string }
  };

  errors = {};

  constructor(private readonly dialog: MatDialog) { }

  ngOnChanges() {
    // separate out expression and component inputs
    const [componentInputs, expressionInputs] = _.partition(
      this.componentInstance.of.inputs,
      (name) => name in this.componentInstance.of.componentInputs
    );
    // get the names
    this.expressionInputs = expressionInputs;
    this.componentInputs = componentInputs;
    this.componentInputsIODescriptions = _.zipObject(
      componentInputs,
      componentInputs.map((ioName) => ioName === '*content'
        ? {}
        : this.app.newComponentInstanceByName(
          _.kebabCase(ioName),
          this.componentInstance.from.name
        ).of['ioDescriptions']
      )
    );
  }

  inputComponent(inputName: string, event: CustomEvent) {
    this.componentInstance.inputSettings[inputName] =
      this.app.newComponentInstanceByName(
        event.detail.componentName,
        event.detail.sourceName
      );
  }

  unInputComponent(inputName: string) {
    this.componentInstance.inputSettings[inputName] = undefined;
  }

  addOutput(inputName: string, event: CustomEvent) {
    this.componentInstance.inputSettings[inputName] = (
      (this.componentInstance.inputSettings[inputName] || '')
      + event.detail.output
    );
  }

  closeMenu(trigger: MatMenuTrigger) {
    trigger.closeMenu();
  }

  openTextEditor() {
    const data: TextDialogData = {
      componentInstance: this.componentInstance,
      readOnly: false
    };
    this.dialog.open(TextComponent, {
      width: '50vw',
      data
    });
  }

  componentInput(name: string) {
    return Object.keys(this.componentInstance.of.componentInputs[name]);
  }

  checkExpr(input, evt) {
    try {
      compileDvExpr(evt.target.value);
      if (this.errors[input] !== undefined) {
        delete this.errors[input];
      }
    } catch (e) {
      this.errors[input] = e.message;
    }
  }
}
