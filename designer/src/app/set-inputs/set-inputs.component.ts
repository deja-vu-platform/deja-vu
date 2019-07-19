import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog, MatMenuTrigger } from '@angular/material';
import * as _ from 'lodash';

import { ActionInstance, App, AppActionDefinition } from '../datatypes';
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
  @Input() actionInstance: ActionInstance;
  @Input() openAction: AppActionDefinition;
  @Input() context = '';

  expressionInputs: string[];
  actionInputs: string[];
  actionInputsIODescriptions: {
    [actionInputName: string]: { [ioName: string]: string }
  };

  errors = {};

  constructor(private readonly dialog: MatDialog) { }

  ngOnChanges() {
    // separate out expression and action inputs
    const [actionInputs, expressionInputs] = _.partition(
      this.actionInstance.of.inputs,
      (name) => name in this.actionInstance.of.actionInputs
    );
    // get the names
    this.expressionInputs = expressionInputs;
    this.actionInputs = actionInputs;
    this.actionInputsIODescriptions = _.zipObject(
      actionInputs,
      actionInputs.map((ioName) => ioName === '*content'
        ? {}
        : this.app.newActionInstanceByName(
          _.kebabCase(ioName),
          this.actionInstance.from.name
        ).of['ioDescriptions']
      )
    );
  }

  inputAction(inputName: string, event: CustomEvent) {
    this.actionInstance.inputSettings[inputName] =
      this.app.newActionInstanceByName(
        event.detail.actionName,
        event.detail.sourceName
      );
  }

  unInputAction(inputName: string) {
    this.actionInstance.inputSettings[inputName] = undefined;
  }

  addOutput(inputName: string, event: CustomEvent) {
    this.actionInstance.inputSettings[inputName] = (
      (this.actionInstance.inputSettings[inputName] || '')
      + event.detail.output
    );
  }

  closeMenu(trigger: MatMenuTrigger) {
    trigger.closeMenu();
  }

  openTextEditor() {
    const data: TextDialogData = {
      actionInstance: this.actionInstance,
      readOnly: false
    };
    this.dialog.open(TextComponent, {
      width: '50vw',
      data
    });
  }

  actionInput(name: string) {
    return Object.keys(this.actionInstance.of.actionInputs[name]);
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
