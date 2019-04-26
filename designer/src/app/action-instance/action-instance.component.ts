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
  ActionInstance,
  AppActionDefinition,
  ClicheActionDefinition
} from '../datatypes';
import { DynamicComponentDirective } from '../dynamic-component.directive';
import { ChildScopeIO, fullyQualifyName, ScopeIO } from '../io';


@Component({
  selector: 'app-action-instance',
  templateUrl: './action-instance.component.html',
  styleUrls: ['./action-instance.component.scss']
})
export class ActionInstanceComponent
implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(DynamicComponentDirective)
    private readonly actionHost: DynamicComponentDirective;

  @Input() actionInstance: ActionInstance;
  // default exists because action instance is top-level in preivew mode
  @Input() parentScopeIO: ScopeIO = new ScopeIO();
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
      this.actionInstance,
      this.parentScopeIO,
      extraScopeIO
        ? { scope: extraScopeIO, inputs: Object.keys(this.extraInputs) }
        : undefined
    );
    this.registerRunService();
  }

  ngAfterViewInit() {
    this.loadContent();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.scopeIO.unlink();
  }

  shouldPassActionInstance() {
    return this.actionInstance.isText;
  }

  /**
   * To be called OnInit
   * Should only be called once
   */
  private registerRunService() {
    if (this.actionInstance && this.actionInstance.isAppAction) {
      this.rs.registerAppAction(this.elem, {});
    }
  }

  /**
   * To be called AfterViewInit
   * Should only be called once
   */
  private loadContent() {
    if (this.actionInstance) {
      if (this.actionInstance.of instanceof AppActionDefinition) {
        this.scopeIO.link();
      } else {
        // setTimeout is necessary to avoid angular change detection errors
        setTimeout(() => this.loadClicheAction());
      }
      setTimeout(() => {
        const sub = this.scopeIO.getSubject('hidden')
          .subscribe((value) => {
            this.hidden = value;
          });
        this.subscriptions.push(sub);
      });
    }
  }

  /**
   * To be called in a new thread AfterViewInit
   */
  private loadClicheAction() {
    // create component and add to DOM
    const actionDefinition = <ClicheActionDefinition>this.actionInstance.of;
    const { component } = actionDefinition;
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(<Type<{}>>component);
    const viewContainerRef = this.actionHost.viewContainerRef;
    viewContainerRef.clear();
    let componentRef = viewContainerRef.createComponent(
      componentFactory,
      0,
      this.injector
    );

    // subscribe to outputs, storing last outputted value
    if (!this.extraInputs) { // inputted actions don't expose outputs
      actionDefinition.outputs.forEach((output) => {
        const sub = (<EventEmitter<any>>componentRef.instance[output])
          .subscribe((val) => {
            const fqName = fullyQualifyName(output, this.actionInstance);
            this.parentScopeIO.getSubject(fqName)
              .next(val);
          });
        this.subscriptions.push(sub);
      });
    }

    const defaults = {};
    // pass in inputs, and allow the value to be updated
    actionDefinition.inputs.forEach((input) => {
      defaults[input] = componentRef.instance[input];
      const fromSubject = this.scopeIO.getSubject(input);
      const sub = fromSubject.subscribe((val) => {
        if (val === undefined) {
          val = defaults[input];
        }
        if (input === '*content') {
          if (val) {
            // create the component to put in ng-content
            let childComponentRef: ComponentRef<ActionInstanceComponent>;
            const childComponentFactory = this.componentFactoryResolver
              .resolveComponentFactory<ActionInstanceComponent>(val.type);
            childComponentRef = childComponentFactory.create(this.injector);
            // we need to recreate the cliche action component with content
            viewContainerRef.clear();
            componentRef = viewContainerRef.createComponent(
              componentFactory,
              0,
              this.injector,
              [[childComponentRef.location.nativeElement]]
            );
            const instance = childComponentRef.instance;
            // pass inputs
            instance.actionInstance =
              val.inputs.actionInstance;
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
              !actionDefinition.actionInputs[input]
              && componentRef.instance[input] !== val
            ) || (
              // action input, new action means changed
              actionDefinition.actionInputs[input]
              && _.get(val, ['inputs', 'actionInstance']) !== _.get(
                componentRef.instance[input],
                ['inputs', 'actionInstance']
              )
            )
          ) {
            componentRef.instance[input] = val;
          }
        }
      });
      this.subscriptions.push(sub);
    });

    // pass the instance for the text action
    if (this.shouldPassActionInstance()) {
      componentRef.instance['actionInstance'] = this.actionInstance;
    }

    // necessary since this may have been instantiated dynamically
    this.ref.detectChanges();
  }
}
