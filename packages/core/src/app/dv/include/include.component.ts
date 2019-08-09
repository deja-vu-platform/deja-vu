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
 *  Represents a DV component to include with `dv-include`
 *
 *  The component given in `type` can be curried and wrapped with an adapter that
 *  allows the interface of the component (input/output names) to be used as
 *  another interface.
 *
 *  For example:
 *  The component given by type=f(fi_1) -> fo_1,
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
export interface ComponentValue {
  // The type of the component to include
  type: Type<Component>;
  tag?: string;
  dvAlias?: string;
  // Optional value to specify the cliche the component is from
  dvOf?: string;
  // A map of (adapter input name) -> (component input name)
  inputMap?: FieldMap;
  // A map of (adapter output name) -> (component output name)
  outputMap?: FieldMap;
  // A map of input names to values. This will be passed to the component when
  // invoked. If an input of the same name is given to the component the input
  // given in `inputs` takes precedence.
  inputs?: FieldMap;
}


@Component({
  selector: 'dv-include',
  templateUrl: './include.component.html'
})
export class IncludeComponent implements AfterViewInit {
  // The DV component to include (see interface Component)
  @Input() component: ComponentValue;

  // The inputs to `component` (`g`, see above)
  // Map of the form (adapter input) -> value
  @Input() inputs: ValueMap | undefined;
  // A map of the form (adapter output name -> parent field name). When the
  // component outputs a value (`g`, see above) the field in `parent` of name
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
    if (this.component === undefined || this.component.type === undefined) {
      throw new Error('No type given to include');
    }
    if (this.parent === undefined) {
      throw new Error('No parent given to include');
    }

    const componentName: string =
      (this.component.dvOf ? `${this.component.dvOf}.` : '') +
      this.component.type.name;
    console.log(`Loading "${componentName}"`);
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(this.component.type);

    const viewContainerRef = this.host.viewContainerRef;
    viewContainerRef.clear();

    this.componentRef = viewContainerRef.createComponent(componentFactory);
    if (this.component.dvOf) {
      NodeUtils.SetOfOfNode(
        this.componentRef.location.nativeElement, this.component.dvOf);
    }

    let shouldCallDetectChanges = false;

    this.component.inputMap = IncludeComponent.initFieldMap(
      this.inputs, this.component.inputMap);
    for (const inputKey of _.keys(this.inputs)) {
      this.componentRef.instance[
        this.component.inputMap[inputKey]] = this.inputs![inputKey];
      shouldCallDetectChanges = true;
    }

    for (const inputKey of _.keys(this.component.inputs)) {
      this.componentRef.instance[inputKey] = this.component.inputs![inputKey];
      shouldCallDetectChanges = true;
    }

    this.component.outputMap = IncludeComponent.initFieldMap(
      this.outputs, this.component.outputMap);
    for (const outputKey of _.keys(this.outputs)) {
      // The call to `subscribe` is mutating the state of the component
      // ref so we need to call detect changes to avoid getting the expression
      // changed after it has been checked error
      shouldCallDetectChanges = true;
      const componentField: string = this.component.outputMap[outputKey];
      if (componentField === undefined) {
       console.warn(
         `Output field ${outputKey} of included component ` +
         `${componentName} is ignored`);
       continue;
      }
      if (!_.has(this.componentRef.instance, componentField)) {
        throw new Error(
          `Included component ${componentName} has no field ${componentField}, ` +
          `output map ${JSON.stringify(this.component.outputMap)} is wrong`);
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
