import {
  Component, Input, ComponentFactoryResolver, ViewContainerRef, ViewChild,
  Directive, AfterViewInit, Type, ComponentRef, SimpleChanges, ChangeDetectorRef
} from '@angular/core';

import * as _ from 'lodash';

import { NodeUtils } from "../node.utils";


@Directive({
  selector: '[include-host]',
})
export class IncludeDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

export interface FieldMap {
  [field: string]: string;
}

export interface ValueMap {
  [field: string]: any;
}

/**
 *  Represents a DV action to include with `dv-include`
 *
 *  The action given in `type` can be curried and wrapped with an adapter that
 *  allows the interface of the action (input/output names) to be used as
 *  another interface.
 *
 *  For example:
 *  The action given by type=f(fi_1) -> fo_1,
 *  inputMap={i_1: 'fi_1'}, outputMap={o_1: 'fo_1'},
 *  inputs={i_2: 'hello'} is equivalent to:
 *
 *  function g(i_1) {
 *    f_result = f(fi_1=i_1, i_2='hello');
 *    return {o_1: f_result.fo_1};
 *  }
 *
 *  If no `inputMap` or `outputMap` is given then the inputs/outputs are not
 *  adapted. In the previous example, if `inputMap` is `undefined` then we have:
 *
 *  function g(fi_1) {
 *    f_result = f(fi_1=fi_1, i_2='hello');
 *    return {o_1: f_result.fo_1};
 *  }
 */
export interface Action {
  // The type of the action to include
  type: Type<Component>;
  tag?: string;
  dvAlias?: string;
  // Optional value to specify the cliche the action is from
  dvOf?: string;
  // A map of (adapter input name) -> (action input name)
  inputMap?: FieldMap;
  // A map of (adapter output name) -> (action output name)
  outputMap?: FieldMap;
  // A map of input names to values. This will be passed to the action when
  // invoked. If an input of the same name is given to the action the input
  // given in `inputs` takes precedence.
  inputs?: FieldMap;
}


@Component({
  selector: 'dv-include',
  templateUrl: './include.component.html'
})
export class IncludeComponent implements AfterViewInit {
  // The DV action to include (see interface Action)
  @Input() action: Action;

  // The inputs to `action` (`g`, see above)
  // Map of the form (adapter input) -> value
  @Input() inputs: ValueMap | undefined;
  // A map of the form (adapter output name -> parent field name). When the
  // action outputs a value (`g`, see above) the field in `parent` of name
  // `field name` is set to the output value if it's a string. If it's a
  // function then it's called with the new value
  @Input() outputs: FieldMap | undefined;
  @Input() parent: Component;

  @ViewChild(IncludeDirective) host: IncludeDirective;

  private isViewInitialized = false;
  private componentRef: ComponentRef<Component>;

  /**
   * If `fieldMap` is undefined it returns the identity field map for `valueMap`
   */
  private static initFieldMap(
    valueMap: ValueMap | undefined, fieldMap: FieldMap | undefined)
    : FieldMap {
    if (fieldMap === undefined) {
      return _.mapValues(valueMap, ({}, key) => key);
    }
    return fieldMap;
  }

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private changeDetectorRef: ChangeDetectorRef) { }

  ngOnChanges(_changes: SimpleChanges) {
    // TODO: don't always reload the entire component
    this.loadComponent();
  }

  ngAfterViewInit() {
    this.isViewInitialized = true;
    this.loadComponent();
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  loadComponent() {
    if (!this.isViewInitialized) {
      return;
    }
    if (this.action === undefined || this.action.type === undefined) {
      throw new Error('No type given to include');
    }
    if (this.parent === undefined) {
      throw new Error('No parent given to include');
    }

    const actionName: string =
      (this.action.dvOf ? `${this.action.dvOf}.` : '') +
      this.action.type.name;
    console.log(`Loading "${actionName}"`);
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(this.action.type);

    const viewContainerRef = this.host.viewContainerRef;
    viewContainerRef.clear();

    this.componentRef = viewContainerRef.createComponent(componentFactory);
    if (this.action.dvOf) {
      NodeUtils.SetOfOfNode(
        this.componentRef.location.nativeElement, this.action.dvOf);
    }

    let shouldCallDetectChanges = false;

    this.action.inputMap = IncludeComponent.initFieldMap(
      this.inputs, this.action.inputMap);
    for (const inputKey of _.keys(this.inputs)) {
      this.componentRef.instance[
        this.action.inputMap[inputKey]] = this.inputs![inputKey];
      shouldCallDetectChanges = true;
    }

    for (const inputKey of _.keys(this.action.inputs)) {
      this.componentRef.instance[inputKey] = this.action.inputs![inputKey];
      shouldCallDetectChanges = true;
    }

    this.action.outputMap = IncludeComponent.initFieldMap(
      this.outputs, this.action.outputMap);
    for (const outputKey of _.keys(this.outputs)) {
      // The call to `subscribe` is mutating the state of the component
      // ref so we need to call detect changes to avoid getting the expression
      // changed after it has been checked error
      shouldCallDetectChanges = true;
      const componentField: string = this.action.outputMap[outputKey];
      if (componentField === undefined) {
       console.warn(
         `Output field ${outputKey} of included action ` +
         `${actionName} is ignored`);
       continue;
      }
      if (!_.has(this.componentRef.instance, componentField)) {
        throw new Error(
          `Included action ${actionName} has no field ${componentField}, ` +
          `output map ${JSON.stringify(this.action.outputMap)} is wrong`);
      }
      this.componentRef.instance[componentField]
        .subscribe(newVal => {
          const propertyName: string = this.outputs![outputKey];
          if (!_.isString(propertyName)) {
            throw new Error(
              `Outputs should be a map of string -> string, found ` +
              `${typeof propertyName} for ${outputKey}`);
          }
          console.log(
            `Got new value ${JSON.stringify(newVal)}, assigning to/calling ` +
            propertyName);
          if (_.isFunction(this.parent[propertyName])) {
            this.parent[propertyName](newVal);
          } else {
            this.parent[propertyName] = newVal;
          }
        });
    }
    // https://github.com/angular/angular/issues/6005
    // Trigger a new round of change detection since we changed fields of
    // componentRef
    if (shouldCallDetectChanges) {
      this.changeDetectorRef.detectChanges();
    }
  }

}