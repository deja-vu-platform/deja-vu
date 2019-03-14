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
        if (val === undefined && io.value !== undefined) {
          let newVal;
          try {
            newVal = JSON.parse(io.value);
          } catch (e) {
            newVal = io.value;
          }
          toSubject.next(newVal);
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
  private sendInputs(
    toAction: ActionInstance,
    inInput?: { name: string, of: ActionInstance }
  ) {
    toAction.of.inputs.forEach((input) => {
      const toSubject = this.getSubject(toAction, input);
      const inputVal = toAction.inputSettings[input];
      if (inputVal) {
        if (_.isString(inputVal)) {
          this.sendExpression(inputVal, toSubject, inInput);
        } else {
          const newInInput = { name: input, of: toAction };
          this.sendInputs(inputVal, newInInput);
          this.sendAction(inputVal, toSubject, newInInput);
        }
      } else {
        toSubject.next(undefined);
      }
    });
  }

  /**
   * @param expr an expression
   * @param toSubject where to send its value
   * If the expression cannot be parsed it just sends the raw string
   */
  private sendExpression(
    expr: string,
    toSubject: BehaviorSubject<any>,
    inInput?: { name: string, of: ActionInstance }
  ) {
    let fromSubject: BehaviorSubject<any>;
    let ioName: string;
    let objectPath: string[];

    if (expr.startsWith('$')) {
      // getting an input from above
      [ioName, ...objectPath] = expr.split('.');
      ioName = ioName.slice(1); // strip leading '$'
      if (inInput && inInput.of.of.actionInputs[inInput.name][ioName]) {
        // getting an input from within an action input
        fromSubject = this.getSubject(inInput.of, ioName);
      } else if (this.actionInstance.of.inputs.includes(ioName)) {
        // getting an input from the parent
        fromSubject = this.getSubject(this.actionInstance, ioName);
      }
    } else {
      // getting an output from a sibling
      let clicheN: string;
      let actionN: string;
      [clicheN, actionN, ioName, ...objectPath] = expr.split('.');
      const fromAction = (<AppActionDefinition>this.actionInstance.of)
        .findChild(clicheN, actionN);
      if (fromAction && fromAction.of.outputs.includes(ioName)) {
        fromSubject = this.getSubject(fromAction, ioName);
      }
    }

    if (fromSubject) {
      // pass value from IO along
      const subscription = fromSubject.subscribe((val) => {
        toSubject.next(_.get(val, objectPath, val));
      });
      this.subscriptions.push(subscription);
    } else {
      // input did not resolve to IO; pass a constant
      // TODO: full expression support
      let val: any;
      try {
        val = JSON.parse(expr);
      } catch (e) { }
      toSubject.next(val);
    }
  }

  /**
   * @param action an action instance
   * @param toSubject where to send a component to render
   */
  private sendAction(
    action: ActionInstance,
    toSubject: BehaviorSubject<any>,
    inInput?: { name: string, of: ActionInstance }
  ) {
    toSubject.next({
      type: ScopeIO.actionInstanceComponent,
      inputs: {
        actionInstance: action,
        actionIO: this.getActionIO(action),
        extraInputs: inInput.of.of.actionInputs[inInput.name],
        extraInputsScope: this.getActionIO(inInput.of)
      }
    });
  }

}
