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


@Component({
  selector: 'dv-include',
  template: `<ng-template include-host></ng-template>`
})
export class IncludeComponent implements AfterViewInit {
  // The type of the component to include
  @Input() type: Type<Component>;
  // Of value
  @Input() of: string;
  // A map from the input names the default action is expecting to the ones of
  // `type`
  @Input() inputMap: FieldMap
  // A map from the output names the default action is expecting to the ones
  // of `type`
  @Input() outputMap: FieldMap

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
    debugger;
    if (changes.type &&
        changes.type.currentValue !== changes.type.previousValue) {
      this.loadComponent();
    }
  }

  ngAfterViewInit() {
    debugger;
    this.isViewInitialized = true;
    this.loadComponent();
  }

  ngOnDestroy() {
    debugger;
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  loadComponent() {
    if (!this.isViewInitialized) {
      return;
    }
    if (this.type === undefined) {
      console.log('No type given to include');
      return;
    }
    if (this.parent === undefined) {
      console.log('No parent given to include');
      return;
    }
    this.inputMap = this.initFieldMap(this.inputs, this.inputMap);
    this.outputMap = this.initFieldMap(this.outputs, this.outputMap);

    console.log(`Loading "${this.type}"` + (this.of ? `of "${this.of}"`: ''));
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(this.type);

    const viewContainerRef = this.host.viewContainerRef;
    viewContainerRef.clear();

    this.componentRef = viewContainerRef.createComponent(componentFactory);

    let shouldCallDetectChanges = false;
    for (const inputKey of _.keys(this.inputs)) {
      this.componentRef.instance[this.inputMap[inputKey]] = this.inputs[inputKey];
      shouldCallDetectChanges = true;
    }
    for (const outputKey of _.keys(this.outputs)) {
      this.componentRef.instance[this.outputMap[outputKey]].subscribe(newVal => {
        debugger;
        console.log(
          `Got new value ${newVal}, assigning to ${this.outputs[outputKey]}`);
        this.parent[this.outputs[outputKey]] = newVal;
      });
    }
    // https://github.com/angular/angular/issues/6005
    // Trigger a new round of change detection since we changed fields of
    // componentRef
    if (shouldCallDetectChanges) {
      debugger;
      this.changeDetectorRef.detectChanges();
    }
  }

  private initFieldMap(valueMap: ValueMap, fieldMap: FieldMap): FieldMap {
    if (fieldMap === undefined) {
      return _.mapValues(valueMap, ({}, key) => key);
    }
    return fieldMap;
  }
}

