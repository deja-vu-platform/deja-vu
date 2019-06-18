/**
 * For dynamically linking inputs and outputs.
 */

import { EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActionInstance, AppActionDefinition } from './datatypes';
import compileDvExpr, { dvToNgName } from './expression.compiler';

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
    private readonly shouldReLink?: EventEmitter<void>,
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
    this.actionInstance.of.inputs.forEach((inputName) => {
      const inputValue = this.actionInstance.inputSettings[inputName];
      if (_.isString(inputValue)) { // expression input
        const toSubject = this.getSubject(inputName);
        this.emitExpressionValue(inputValue, toSubject, this.parentScope);
      } else if (inputValue instanceof ActionInstance) { // action input
        this.emitAction(inputValue, inputName);
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
      this.emitExpressionValue(value, toSubject, this);
    });
  }

  /**
   * Parse an expression and set its value on the subject
   *   (from this or another ScopeIO probably) using values
   *   from the given scope.
   * It updates the value when any referenced value changes.
   * Cannot be called externally because it does not clean up subs.
   */
  private emitExpressionValue(
    dvExpression: string,
    toSubject: BehaviorSubject<any>,
    fromScope: ScopeIO
  ) {
    let compiledDvExpr;
    try {
      compiledDvExpr = compileDvExpr(dvExpression);
    } catch (e) {
      console.error(`Failed to compile ${dvExpression}`);
      console.error(e);

      return;
    }
    const { names, evaluate } = compiledDvExpr;
    const ngScope = {};
    const send = () => toSubject.next(evaluate(ngScope));
    names.forEach((refdName) => {
      // $ means get input to parent or replaced action
      const fromAbove = refdName.startsWith('$');
      // keys for subjects in ScopeIO do not have leading $
      const ioScopeName = fromAbove ? refdName.slice(1) : refdName;
      // if in an action input, $ gets input to replaced action
      //   falling back to parent input
      if (
        fromAbove
        && fromScope === this.parentScope
        && this.extra
        && this.extra.inputs.indexOf(ioScopeName) >= 0
      ) {
        fromScope = this.extra.scope;
      }
      const refdSubject = fromScope.getSubject(ioScopeName);
      // Expression is something like c.a.o.p (let's say equaling x)
      //   evaluate will want ngScope to be { c: { a: { o: { p: x } } } }
      //   the subject's key is "c.a.o" and will return v = { p: x }
      //   so we want to set ngScope.c.a.o = v
      // dvToNgName converts dv-legal names to ng-legal names
      //   it wants the $
      const ngScopePath = refdName.split('.')
        .map(dvToNgName);
      const sub = refdSubject.subscribe((refdValue) => {
        _.set(ngScope, ngScopePath, refdValue);
        send();
      });
      this.subscriptions.push(sub);
    });
    send();
  }

  /**
   * Send an action instance to the given input (on this action).
   * It's less general than emitExpressionValue since actions can only
   *   be inputted.
   */
  private emitAction(
    actionInstance: ActionInstance,
    toInputName: string
  ) {
    const toSubject = this.getSubject(toInputName);
    toSubject.next({
      type: ChildScopeIO.actionInstanceComponent,
      inputs: {
        actionInstance: actionInstance,
        parentScope: this,
        shouldReLink: this.shouldReLink,
        extraInputs: this.actionInstance.of.actionInputs[toInputName]
      }
    });
  }
}
