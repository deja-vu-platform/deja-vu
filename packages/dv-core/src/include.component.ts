import {
  Component, Input, ComponentFactoryResolver, ViewContainerRef, ViewChild,
  Directive, AfterViewInit, Type, ComponentRef, SimpleChanges, ChangeDetectorRef
} from '@angular/core';

import * as _ from 'lodash';


@Directive({
  selector: '[include-host]',
})
export class IncludeDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

export type FieldMap = {[field: string]: string};
export type ValueMap = {[field: string]: any};

export interface Action {
  // The type of the component to include
  type: Type<Component>;
  // Of value
  of?: string;
  // A map from the input names the default action is expecting to the ones of
  // `type`
  inputMap?: FieldMap
  // A map from the output names the default action is expecting to the ones
  // of `type`
  outputMap?: FieldMap
  // A map of input names to values. This will be passed to the action when 
  // invoked. If an input of the same name is given to the action the input
  // given in `inputs` takes precedence.
  inputs?: FieldMap
}


@Component({
  selector: 'dv-include',
  template: `<ng-template include-host></ng-template>`
})
export class IncludeComponent implements AfterViewInit {
  @Input() action: Action;

  @Input() inputs: ValueMap;
  @Input() outputs: ValueMap;
  @Input() parent: Component;

  @ViewChild(IncludeDirective) host: IncludeDirective;

  private isViewInitialized: boolean = false;
  private componentRef: ComponentRef<Component>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private changeDetectorRef: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.type &&
        changes.type.currentValue !== changes.type.previousValue) {
      this.loadComponent();
    }
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
      console.log('No type given to include');
      return;
    }
    if (this.parent === undefined) {
      console.log('No parent given to include');
      return;
    }
    this.action.inputMap = this.initFieldMap(this.inputs, this.action.inputMap);
    this.action.outputMap = this
      .initFieldMap(this.outputs, this.action.outputMap);

    console.log(
      `Loading "${this.action.type}"` +
      (this.action.of ? `of "${this.action.of}"`: ''));
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(this.action.type);

    const viewContainerRef = this.host.viewContainerRef;
    viewContainerRef.clear();

    this.componentRef = viewContainerRef.createComponent(componentFactory);

    let shouldCallDetectChanges = false;
    for (const inputKey of _.keys(this.inputs)) {
      this.componentRef.instance[
        this.action.inputMap[inputKey]] = this.inputs[inputKey];
      shouldCallDetectChanges = true;
    }
    for (const inputKey of _.keys(this.action.inputs)) {
      this.componentRef.instance[inputKey] = this.action.inputs[inputKey];
      shouldCallDetectChanges = true;   
    }
    for (const outputKey of _.keys(this.outputs)) {
      this.componentRef.instance[this.action.outputMap[outputKey]]
        .subscribe(newVal => {
          console.log(
            `Got new value ${newVal}, assigning to ${this.outputs[outputKey]}`);
          this.parent[this.outputs[outputKey]] = newVal;
        });
    }
    // https://github.com/angular/angular/issues/6005
    // Trigger a new round of change detection since we changed fields of
    // componentRef
    if (shouldCallDetectChanges) {
      this.changeDetectorRef.detectChanges();
    }
  }

  private initFieldMap(valueMap: ValueMap, fieldMap: FieldMap | undefined)
    : FieldMap {
    if (fieldMap === undefined) {
      return _.mapValues(valueMap, ({}, key) => key);
    }
    return fieldMap;
  }
}

