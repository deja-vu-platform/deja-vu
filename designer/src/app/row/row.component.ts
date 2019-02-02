import { Component, Input, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActionInstance, AppActionDefinition, Row } from '../datatypes';

@Component({
  selector: 'app-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss']
})
export class RowComponent implements OnDestroy {
  @Input() openAction: AppActionDefinition;
  @Input() row = new Row(); // we always show an extra row
  @Input() rowNum = -1;
  subscriptions: Subscription[] = [];

  onMenuClosed(action: ActionInstance) {
    this.subscriptions.forEach((s) => s.unsubscribe());

    action.of.inputs.forEach((input) => {
      const toSubject = action.io[input];
      const inputStr = action.inputSettings[input];

      // if they specified an output (e.g. dv.gen-id.id) then subscribe
      const gotOutput = this.resolveOutput(toSubject, inputStr);

      // TODO: getting parent input

      // if their input did not match to an output just pass the string as-is
      if (!gotOutput) {
        toSubject.next(inputStr);
      }

      // TODO: full expression support
    });
  }

  /**
   * Set an input to an output, referenced by the user input string
   * @param toSubject the rxjs subject for the input we are setting
   * @param inputStr what the user typed in
   */
  resolveOutput(toSubject: BehaviorSubject<any>, inputStr = ''): boolean {
    const [cliche, action, output, ...objectPath] = inputStr.split('.');
    const fromAction = this.resolveAction(cliche, action);
    if (fromAction) {
      if (fromAction.of.outputs.indexOf(output) >= 0) {
        this.subscriptions.push(
          fromAction.io[output].subscribe((val) => {
            toSubject.next(_.get(val, objectPath, val));
          })
        );

        return true;
      }
    }

    return false;
  }

  /**
   * Find a sibling action by cliche & action name
   * @return the action, or undefined if there is no match
   * TODO: support multiple instances on same page
   */
  resolveAction(
    clicheName: string,
    actionName: string
  ): ActionInstance | undefined {
    for (const row of this.openAction.rows) {
      const action = row.actions.find((a) =>
        a.from.name === clicheName && a.of.name === actionName
      );
      if (action) { return action; }
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}

