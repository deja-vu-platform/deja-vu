import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  ActionInstance,
  AppActionDefinition,
  InInput
} from './datatypes';
import compileDvExpr, { dvToNgName } from './expression.compiler';
import { resolveName } from './io-references';

export class ActionIO {
  private readonly subjects: { [ioName: string]: BehaviorSubject<any> } = {};

  getSubject(ioName: string): BehaviorSubject<any> {
    if (!this.subjects[ioName]) {
      const subject = new BehaviorSubject<any>(undefined);
      this.subjects[ioName] = subject;
    }

    return this.subjects[ioName];
  }

}

export class ScopeIO {
  // populated in app.module.ts to avoid cyclic imports
  static actionInstanceComponent: any;

  private readonly rep: { [actionID: string]: ActionIO } = {};

  private subscriptions: Subscription[] = [];
  private actionInstance: ActionInstance;

  get actionDefinition(): AppActionDefinition {
    return this.actionInstance.of as AppActionDefinition;
  }

  /**
   * Public because used to link scopes when an app action is instantiated
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
   */
  link(actionInstance: ActionInstance): void {
    this.unlink();
    this.actionInstance = actionInstance;

    // child inputs (expression or action)
    this.actionDefinition.getChildren(false)
      .forEach((c) => { this.sendInputs(c); });

    // parent outputs (expression)
    this.actionDefinition.outputSettings.forEach((io) => {
      this.sendExpression(io.value, actionInstance, io.name);
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
  private sendInputs(toAction: ActionInstance, inInput?: InInput) {
    toAction.of.inputs.forEach((input) => {
      const toSubject = this.getSubject(toAction, input);
      const inputVal = toAction.inputSettings[input];
      if (inputVal) {
        if (_.isString(inputVal)) {
          this.sendExpression(inputVal, toAction, input, inInput);
        } else {
          const newInInput: InInput = { of: toAction, name: input };
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
   * @param inInput given if this expression is going to a replacing action
   * If the expression cannot be parsed it just sends the raw string
   */
  private sendExpression(
    expr: string,
    toAction: ActionInstance,
    toIO: string,
    inInput?: InInput
  ) {
    const { names, evaluate } = compileDvExpr(expr);
    const scope = {};
    const toSubject = this.getSubject(toAction, toIO);
    const sendValue = () => toSubject.next(evaluate(scope));

    names.forEach((name) => {
      const { fromAction, ioName } = resolveName(
        name,
        this.actionInstance,
        inInput
      );

      if (!fromAction) { return; }

      // add current value to scope
      let objectToModify: Object;
      const subject = this.getSubject(fromAction, ioName);
      let ioNameInScope = ioName;
      if (
        fromAction.id === this.actionInstance.id
        || (inInput && fromAction.id === inInput.of.id)
      ) {
        objectToModify = scope;
        ioNameInScope = '$' + ioName;
      } else {
        const clicheName = dvToNgName(fromAction.from.name);
        const actionName = dvToNgName(fromAction.of.name);
        scope[clicheName] = scope[clicheName] || {};
        scope[clicheName][actionName] = scope[clicheName][actionName] || {};
        objectToModify = scope[clicheName][actionName];
      }
      objectToModify[ioNameInScope] = subject.value;
      const sub = subject.subscribe((value) => {
        objectToModify[ioNameInScope] = value;
        sendValue();
      });
      this.subscriptions.push(sub);
    });

    sendValue();
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
