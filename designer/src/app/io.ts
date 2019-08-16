/**
 * For dynamically linking inputs and outputs.
 */

import { EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AppComponentDefinition, ComponentInstance } from './datatypes';
import compileDvExpr, { dvToNgName } from './expression.compiler';

/**
 * ioName + component => concept.component.ioName
 * @todo handle name collisions
 */
export function fullyQualifyName(
  ioName: string,
  componentInstance: ComponentInstance
  ): string {
    return (
      `${componentInstance.from.name}.${componentInstance.of.name}.${ioName}`);
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
  static componentInstanceComponent: any;

  private readonly subscriptions: Subscription[] = [];

  /**
   * @param componentInstance
   * @param parentScope
   * @param extra - only present if this component was given to an input
   */
  constructor(
    private readonly componentInstance: ComponentInstance,
    private readonly parentScope: ScopeIO,
    private readonly shouldReLink?: EventEmitter<void>,
    private readonly extra?: { inputs: string[], scope: ScopeIO }
  ) {
    super();
  }

  /**
   * Parses all expressions.
   * Retrieves values from the parent scope to set inputs here.
   * Sets values on the parent scope from outputs here (if app component).
   */
  link() {
    this.unlink();
    this.linkInputs();
    if (this.componentInstance.of instanceof AppComponentDefinition) {
      this.linkOutputsForAppComponent();
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
    this.componentInstance.of.inputs.forEach((inputName) => {
      const inputValue = this.componentInstance.inputSettings[inputName];
      if (_.isString(inputValue)) { // expression input
        const toSubject = this.getSubject(inputName);
        this.emitExpressionValue(inputValue, toSubject, this.parentScope);
      } else if (inputValue instanceof ComponentInstance) { // component input
        this.emitComponent(inputValue, inputName);
      }
    });
  }

  /**
   * Sets values on the parent scope from outputs here (if app component).
   * Cannot be called externally because it does not clean up subs.
   */
  private linkOutputsForAppComponent() {
    if (!(this.componentInstance.of instanceof AppComponentDefinition)) {
      throw new Error('Component is not an app component.');
    }

    this.componentInstance.of.outputSettings.forEach(({ name, value }) => {
      const fqName = fullyQualifyName(name, this.componentInstance);
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
      // $ means get input to parent or replaced component
      const fromAbove = refdName.startsWith('$');
      // keys for subjects in ScopeIO do not have leading $
      const ioScopeName = fromAbove ? refdName.slice(1) : refdName;
      // if in an component input, $ gets input to replaced component
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
   * Send an component instance to the given input (on this component).
   * It's less general than emitExpressionValue since components can only
   *   be inputted.
   */
  private emitComponent(
    componentInstance: ComponentInstance,
    toInputName: string
  ) {
    const toSubject = this.getSubject(toInputName);
    toSubject.next({
      type: ChildScopeIO.componentInstanceComponent,
      inputs: {
        componentInstance: componentInstance,
        parentScope: this,
        shouldReLink: this.shouldReLink,
        extraInputs: this.componentInstance.of.componentInputs[toInputName]
      }
    });
  }
}
