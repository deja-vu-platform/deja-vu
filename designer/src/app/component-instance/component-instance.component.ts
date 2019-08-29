import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Type,
  ViewChild
} from '@angular/core';
import { RunService } from '@deja-vu/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import {
  AppComponentDefinition,
  ComponentInstance,
  ConceptComponentDefinition
} from '../datatypes';
import { DynamicComponentDirective } from '../dynamic-component.directive';
import { ChildScopeIO, fullyQualifyName, ScopeIO } from '../io';


@Component({
  selector: 'app-component-instance',
  templateUrl: './component-instance.component.html',
  styleUrls: ['./component-instance.component.scss']
})
export class ComponentInstanceComponent
implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(DynamicComponentDirective)
    private readonly componentHost: DynamicComponentDirective;

  @Input() componentInstance: ComponentInstance;
  // default exists because component instance is top-level in preivew mode
  @Input() parentScopeIO: ScopeIO = new ScopeIO();
  // not passed to children because their inputs are not editable in this
  //   context (but it is passed to inputted components because theirs are)
  @Input() shouldReLink: EventEmitter<any>;
  // for when rendered in dv-include only
  @Input() extraInputs?: { [ioName: string]: string };

  scopeIO: ChildScopeIO;
  private subscriptions: Subscription[] = [];
  hidden = false;

  constructor(
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly elem: ElementRef,
    private readonly rs: RunService,
    private readonly injector: Injector,
    public readonly ref: ChangeDetectorRef
  ) { }

  ngOnInit() {
    let extraScopeIO: ScopeIO;
    if (this.extraInputs) {
      extraScopeIO = new ScopeIO();
      _.forOwn(this.extraInputs, (thisProp, ioName) => {
        extraScopeIO.getSubject(ioName)
          .next(this[thisProp]);
      });
    }
    this.scopeIO = new ChildScopeIO(
      this.componentInstance,
      this.parentScopeIO,
      this.shouldReLink,
      extraScopeIO
        ? { scope: extraScopeIO, inputs: Object.keys(this.extraInputs) }
        : undefined
    );
    this.scopeIO.link();
    if (this.shouldReLink) { // not given for top level
      this.shouldReLink.subscribe(() => this.scopeIO.link());
    }
    this.registerRunService();
  }

  ngAfterViewInit() {
    this.loadContent();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.scopeIO.unlink();
  }

  shouldPassComponentInstance() {
    return this.componentInstance.isText;
  }

  /**
   * To be called OnInit
   * Should only be called once
   */
  private registerRunService() {
    if (this.componentInstance && this.componentInstance.isAppComponent) {
      this.rs.registerAppComponent(this.elem, {});
    }
  }

  /**
   * To be called AfterViewInit
   * Should only be called once
   */
  private loadContent() {
    if (!(this.componentInstance.of instanceof AppComponentDefinition)) {
      // setTimeout is necessary to avoid angular change detection errors
      setTimeout(() => this.loadConceptComponent());
    }
    setTimeout(() => {
      const sub = this.scopeIO.getSubject('hidden')
        .subscribe((value) => {
          this.hidden = value;
        });
      this.subscriptions.push(sub);
    });
  }

  /**
   * To be called in a new thread AfterViewInit
   */
  private loadConceptComponent() {
    // create component and add to DOM
    const componentDefinition = <ConceptComponentDefinition> this
      .componentInstance.of;
    const { component } = componentDefinition;
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(<Type<{}>>component);
    const viewContainerRef = this.componentHost.viewContainerRef;
    viewContainerRef.clear();
    let componentRef = viewContainerRef.createComponent(
      componentFactory,
      0,
      this.injector
    );

    // subscribe to outputs, storing last outputted value
    if (!this.extraInputs) { // inputted components don't expose outputs
      componentDefinition.outputs.forEach((output) => {
        const sub = (<EventEmitter<any>>componentRef.instance[output])
          .subscribe((val) => {
            const fqName = fullyQualifyName(output, this.componentInstance);
            this.parentScopeIO.getSubject(fqName)
              .next(val);
          });
        this.subscriptions.push(sub);
      });
    }

    const defaults = {};
    // pass in inputs, and allow the value to be updated
    componentDefinition.inputs.forEach((input) => {
      defaults[input] = componentRef.instance[input];
      const fromSubject = this.scopeIO.getSubject(input);
      const sub = fromSubject.subscribe((val) => {
        if (val === undefined) {
          val = defaults[input];
        }
        if (input === '*content') {
          if (val) {
            // create the component to put in ng-content
            let childComponentRef: ComponentRef<ComponentInstanceComponent>;
            const childComponentFactory = this.componentFactoryResolver
              .resolveComponentFactory<ComponentInstanceComponent>(val.type);
            childComponentRef = childComponentFactory.create(this.injector);
            // we need to recreate the concept component component with content
            viewContainerRef.clear();
            componentRef = viewContainerRef.createComponent(
              componentFactory,
              0,
              this.injector,
              [[childComponentRef.location.nativeElement]]
            );
            const instance = childComponentRef.instance;
            // pass inputs
            instance.componentInstance =
              val.inputs.componentInstance;
            instance.parentScopeIO = val.inputs.parentScopeIO;
            // detect changes since Angular doesn't expect inputs like this
            instance.ref.detectChanges();
            // trigger lifecylce hooks, which would have already fired
            instance.ngOnInit();
            instance.ngAfterViewInit();
          } else {
            // re-render the component with no content
            viewContainerRef.clear();
            componentRef = viewContainerRef.createComponent(
              componentFactory,
              0,
              this.injector
            );
          }
        } else {
          // only pass the new value if it actually changed
          if (
            (
              // expression input, not equal means changed
              !componentDefinition.componentInputs[input]
              && componentRef.instance[input] !== val
            ) || (
              // component input, new component means changed
              componentDefinition.componentInputs[input]
              && _.get(val, ['inputs', 'componentInstance']) !== _.get(
                componentRef.instance[input],
                ['inputs', 'componentInstance']
              )
            )
          ) {
            componentRef.instance[input] = val;
          }
        }
      });
      this.subscriptions.push(sub);
    });

    // pass the instance for the text component
    if (this.shouldPassComponentInstance()) {
      componentRef.instance['componentInstance'] = this.componentInstance;
    }

    // necessary since this may have been instantiated dynamically
    this.ref.detectChanges();
  }
}
