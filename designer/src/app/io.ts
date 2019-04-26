/**
 * For dynamically linking inputs and outputs.
 */

import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActionInstance, AppActionDefinition } from './datatypes';
import compileExprDV, { dvToNgName } from './expression.compiler';

/**
 * ioName + action => cliche.action.ioName
 * @todo handle name collisions
 */
export function fullyQualifyName(
  ioName: string,
  actionInstance: ActionInstance
  ): string {
    return `${actionInstance.from.name}.${actionInstance.of.name}.${ioName}`;
}

export class ScopeIO {
  private readonly subjects: { [ioName: string]: BehaviorSubject<any> } = {};

  /**
   * Get a subject, creating one if it doesn't exist.
   */
  getSubject(ioName: string): BehaviorSubject<any> {
    if (!this.subjects[ioName]) {
      this.subjects[ioName] = new BehaviorSubject(undefined);
    }

    return this.subjects[ioName];
  }

  hasSubject(ioName: string): boolean {
    return !!this.subjects[ioName];
  }
}

export class ChildScopeIO extends ScopeIO {
  // populated in app.module.ts to avoid cyclic imports
  static actionInstanceComponent: any;

  private readonly subscriptions: Subscription[] = [];

  /**
   * @param actionInstance
   * @param parentScope
   * @param extra - only present if this action was given to an input
   */
  constructor(
    private readonly actionInstance: ActionInstance,
    private readonly parentScope: ScopeIO,
    private readonly extra?: { inputs: string[], scope: ScopeIO }
  ) {
    super();
  }

  /**
   * Parses all expressions.
   * Retrieves values from the parent scope to set inputs here.
   * Sets values on the parent scope from outputs here (if app action).
   */
  link() {
    this.unlink();
    this.linkInputs();
    if (this.actionInstance.of instanceof AppActionDefinition) {
      this.linkOutputsForAppAction();
    }
  }

  /**
   * Remove all links.
   */
  unlink() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions.length = 0;
  }

  /**
   * Retrieves values from the parent scope to set inputs here.
   * Cannot be called externally because it does not clean up subs.
   */
  private linkInputs() {
    this.actionInstance.walkInputs(false, (inputName, value) => {
      if (_.isString(value)) { // expression input
        const toSubject = this.getSubject(inputName);
        this.sendExpression(value, toSubject, this.parentScope);
      } else { // action input
        this.sendAction(value, inputName);
      }
    });
  }

  /**
   * Sets values on the parent scope from outputs here (if app action).
   * Cannot be called externally because it does not clean up subs.
   */
  private linkOutputsForAppAction() {
    if (!(this.actionInstance.of instanceof AppActionDefinition)) {
      throw new Error('Action is not an app action.');
    }

    this.actionInstance.of.outputSettings.forEach(({ name, value }) => {
      const fqName = fullyQualifyName(name, this.actionInstance);
      const toSubject = this.parentScope.getSubject(fqName);
      this.sendExpression(value, toSubject, this);
    });
  }

  /**
   * Parse an expression and set its value on the subject
   *   (from this or another ScopeIO probably) using values
   *   from the given scope.
   * It updates the value when any referenced value changes.
   * Cannot be called externally because it does not clean up subs.
   */
  private sendExpression(
    dvExpression: string,
    toSubject: BehaviorSubject<any>,
    fromScope: ScopeIO
  ) {
    const { names, evaluate } = compileExprDV(dvExpression);
    const ngScope = {};
    const send = () => toSubject.next(evaluate(ngScope));
    names.forEach((refdName) => {
      const fromAbove = refdName.startsWith('$');
      // keys for subjects in ScopeIO do not have leading $
      const scopeName = fromAbove ? refdName.slice(1) : refdName;
      // if in an action input, $ gets extra input to replaced action
      //   falling back to parent input
      if (
        fromAbove
        && fromScope === this.parentScope
        && this.extra
        && this.extra.inputs.indexOf(scopeName) >= 0
      ) {
        fromScope = this.extra.scope;
      }
      const refdSubject = fromScope.getSubject(scopeName);
      const sub = refdSubject.subscribe((refdValue) => {
        ngScope[dvToNgName(refdName)] = refdValue; // ngExpr will have $
        send();
      });
      this.subscriptions.push(sub);
    });
    send();
  }

  /**
   * Send an action instance to the given input (on this action).
   * It's less general than sendExpression since actions can only
   *   be inputted.
   */
  private sendAction(
    actionInstance: ActionInstance,
    toInputName: string
  ) {
    const toSubject = this.getSubject(toInputName);
    toSubject.next({
      type: ChildScopeIO.actionInstanceComponent,
      inputs: {
        actionInstance: actionInstance,
        parentScope: this,
        extraInputs: this.actionInstance.of.actionInputs[toInputName]
      }
    });
  }
}
