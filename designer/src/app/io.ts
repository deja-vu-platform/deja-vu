import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  ActionInstance,
  AppActionInstance,
  InInput
} from './datatypes';

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
  private actionInstance: AppActionInstance;

  /**
   * Used to link scopes when an app action is instantiated
   * in another app action
   */
  setActionIO(action: ActionInstance, actionIO: ActionIO): void {
    this.rep[action.id] = actionIO;
  }

  /**
   * Get only the I/O settings of a single action
   * Public so setActionIO can be used
   */
  getActionIO(action: ActionInstance): ActionIO {
    if (!this.rep[action.id]) {
      this.setActionIO(action, new ActionIO());
    }

    return this.rep[action.id];
  }

  /**
   * Get the RxJS subject for a single input/output
   * Public so values can be sent to / gotten from cliche actions
   * And because we need some values (e.g. hidden)
   */
  getSubject(action: ActionInstance, ioName: string): BehaviorSubject<any> {
    const actionIO = this.getActionIO(action);

    return actionIO.getSubject(ioName);
  }

  /**
   * Take an instance of an app action
   * and set up subscriptions so that all values flow to/between
   * this action and its children as they should
   * This also sets the context to the action you give it
   * @param actionInstance
   */
  link(actionInstance: AppActionInstance): void {
    this.unlink();
    this.actionInstance = actionInstance;
    this.actionInstance.resolveReferences();

    // child inputs (expression or action)
    this.actionInstance.of.getChildren()
      .forEach((c) => this.sendInputs(c));

    // parent outputs (expression)
    this.actionInstance.of.outputSettings.forEach((io) => {
      this.sendExpression(io.value, actionInstance, io.name);
    });

    // parent inputs (default constant value)
    this.actionInstance.of.inputSettings.forEach((io) => {
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

  /**
   * Unset the action and delete all I/O links
   */
  unlink() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
    this.actionInstance = undefined;
  }

  /**
   * Gets the action's input settings, resolves the values,
   *   and sends them to the IO subjects
   */
  private sendInputs(toAction: ActionInstance) {
    toAction.of.inputs.forEach((input) => {
      const toSubject = this.getSubject(toAction, input);
      const inputVal = toAction.inputSettings[input];
      if (inputVal) {
        if (_.isString(inputVal)) {
          this.sendExpression(inputVal, toAction, input);
        } else {
          const inInput = { name: input, of: toAction };
          this.sendInputs(inputVal);
          this.sendAction(inputVal, toSubject, inInput);
        }
      } else {
        toSubject.next(undefined);
      }
    });
  }

  /**
   * @param expr an expression
   * @param toSubject where to send its value
   * @param inInput given if this expression is going to a replacing action
   * If the expression cannot be parsed it just sends the raw string
   */
  private sendExpression(
    expr: string,
    toAction: ActionInstance,
    toIO: string
  ) {
    const resolution = this.actionInstance.references[toAction.id][toIO];
    const toSubject = this.getSubject(toAction, toIO);

    if (resolution) {
      // pass value from IO along
      const { fromAction, ioName, objectPath } = resolution;
      const fromSubject = this.getSubject(fromAction, ioName);
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
    inInput?: InInput
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
