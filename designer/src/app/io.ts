import { Component } from '@angular/compiler/src/core';
import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActionInstance, AppActionDefinition } from './datatypes';

export class ActionIO {
  private readonly rep: { [ioName: string]: BehaviorSubject<any> } = {};

  getSubject(ioName: string): BehaviorSubject<any> {
    if (!this.rep[ioName]) {
      this.rep[ioName] = new BehaviorSubject<any>(undefined);
    }

    return this.rep[ioName];
  }

}

export class ScopeIO {
  // populated in app.module.ts to avoid cyclic imports
  static actionInstanceComponent: any;

  private readonly rep: { [actionID: string]: ActionIO } = {};
  private subscriptions: Subscription[] = [];
  private actionInstance: ActionInstance;

  private get actionDefinition(): AppActionDefinition {
    return this.actionInstance
      ? <AppActionDefinition>this.actionInstance.of
      : undefined;
  }

  setActionIO(action: ActionInstance, actionIO: ActionIO): void {
    this.rep[action.id] = actionIO;
  }

  getActionIO(action: ActionInstance): ActionIO {
    if (!this.rep[action.id]) {
      this.setActionIO(action, new ActionIO());
    }

    return this.rep[action.id];
  }

  getSubject(action: ActionInstance, ioName: string): BehaviorSubject<any> {
    const actionIO = this.getActionIO(action);

    return actionIO.getSubject(ioName);
  }

  link(actionInstance: ActionInstance): void {
    if (!(actionInstance.of instanceof AppActionDefinition)) {
      throw new TypeError(
        `Action Instance ${actionInstance.fqtag} is not of App Action`);
    }

    this.unsubscribeAll();
    this.actionInstance = actionInstance;

    // child inputs (expression or action)
    this.actionDefinition.children.forEach((c) => this.sendInputs(c));

    // parent outputs (expression)
    this.actionDefinition.outputSettings.forEach((io) => {
      const toSubject = this.getSubject(actionInstance, io.name);
      const inputStr = io.value;
      this.sendExpression(inputStr, toSubject);
    });

    // parent inputs (default constant value)
    this.actionDefinition.inputSettings.forEach((io) => {
      const toSubject = this.getSubject(actionInstance, io.name);
      toSubject.subscribe((val) => {
        if (val === undefined) {
          toSubject.next(io.value);
        }
      });
    });
  }

  unlink() {
    this.unsubscribeAll();
    this.actionInstance = undefined;
  }

  private unsubscribeAll() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Gets the action's input settings, resolves the values,
   *   and sends them to the IO subjects
   */
  private sendInputs(action: ActionInstance) {
    action.of.inputs.forEach((input) => {
      const toSubject = this.getSubject(action, input);
      const inputVal = action.inputSettings[input];
      if (inputVal) {
        if (_.isString(inputVal)) {
          this.sendExpression(inputVal, toSubject);
        } else {
          this.sendInputs(inputVal);
          this.sendAction(inputVal, toSubject);
        }
      }
    });
  }

  /**
   * @param expr an expression
   * @param toSubject where to send its value
   * If the expression cannot be parsed it just sends the raw string
   */
  private sendExpression(expr: string, toSubject: BehaviorSubject<any>) {
    const [clicheN, actionN, ioN, ...objectPath] = expr.split('.');

    let fromAction = (<AppActionDefinition>this.actionInstance.of)
      .findChild(clicheN, actionN);
    let fromSubjectList: 'inputs' | 'outputs';
    if (fromAction) {
      fromSubjectList = 'outputs';
    } else if (
      this.actionInstance.from.name === clicheN
      && this.actionInstance.of.name === actionN
    ) {
      fromAction = this.actionInstance;
      fromSubjectList = 'inputs';
    }

    if (fromAction && fromAction.of[fromSubjectList].indexOf(ioN) >= 0) {
      const sub = this.getSubject(fromAction, ioN)
        .subscribe((val) => {
          toSubject.next(_.get(val, objectPath, val));
        });
      this.subscriptions.push(sub);
    } else {
      toSubject.next(expr); // just pass the string as-is
    }
  }

  /**
   * @param action an action instance
   * @param toSubject where to send a component to render
   */
  private sendAction(action: ActionInstance, toSubject: BehaviorSubject<any>) {
    toSubject.next({
      type: ScopeIO.actionInstanceComponent,
      inputs: {
        actionInstance: action,
        actionIO: this.getActionIO(action)
      }
      // TODO: pass io that would have gone to orignal action
    });
  }

}
