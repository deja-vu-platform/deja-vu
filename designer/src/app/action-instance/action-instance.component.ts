import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
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

import { ClicheActionDirective } from '../cliche-action.directive';
import {
  ActionInstance,
  AppActionDefinition,
  ClicheActionDefinition
} from '../datatypes';
import { ActionIO, ScopeIO} from '../io';


@Component({
  selector: 'app-action-instance',
  templateUrl: './action-instance.component.html',
  styleUrls: ['./action-instance.component.scss']
})
export class ActionInstanceComponent
implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(ClicheActionDirective)
    private readonly actionHost: ClicheActionDirective;
  @Input() actionInstance: ActionInstance;
  @Input() actionIO: ActionIO;
  private readonly scopeIO: ScopeIO = new ScopeIO();
  private subscriptions: Subscription[] = [];
  // for when rendered in dv-include only
  @Input() extraInputs?: { [ioName: string]: string };
  @Input() extraInputsScope?: ActionIO;
  hidden = false;

  constructor(
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly elem: ElementRef,
    private readonly rs: RunService,
    private readonly injector: Injector,
    public readonly ref: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.linkScopes();
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
    return (
      this.actionInstance.from.name === 'dv'
      && this.actionInstance.of.name === 'text'
    );
  }

  /**
   * To be called OnInit
   * Should only be called once
   */
  private registerRunService() {
    if (this.actionInstance && this.actionInstance.isAppAction) {
      this.rs.registerAppAction(this.elem, this);
    }
  }

  /**
   * To be called OnInit
   * Should only be called once
   */
  private linkScopes() {
    if (this.actionInstance && this.actionIO) {
      this.scopeIO.setActionIO(this.actionInstance, this.actionIO);
      if (this.extraInputs && this.extraInputsScope) {
        _.forEach(this.extraInputs, (thisProp, ioName) => {
          this.extraInputsScope.getSubject(ioName)
            .next(this[thisProp]);
        });
      }
    }
  }

  /**
   * To be called AfterViewInit
   * Should only be called once
   */
  private loadContent() {
    if (this.actionInstance) {
      if (this.actionInstance.of instanceof AppActionDefinition) {
        this.scopeIO.link(this.actionInstance);
      } else {
        // setTimeout is necessary to avoid angular change detection errors
        setTimeout(() => this.loadClicheAction());
      }
      setTimeout(() => {
        const sub = this.actionIO.getSubject('hidden')
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
    console.log('loading', this.actionInstance);
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
    actionDefinition.outputs.forEach((output) => {
      this.subscriptions.push(
        (<EventEmitter<any>>componentRef.instance[output]).subscribe((val) => {
          this.actionIO.getSubject(output)
            .next(val);
        })
      );
    });

    // pass in inputs, and allow the value to be updated
    actionDefinition.inputs.forEach((input) => {
      // give new values
      this.subscriptions.push(
        this.actionIO.getSubject(input)
          .subscribe((val) => {
            if (val === undefined) { return; }
            if (input === '*content') {
              // create the component to put in ng-content
              const childComponentFactory = this.componentFactoryResolver
                .resolveComponentFactory<ActionInstanceComponent>(val.type);
              const childComponentRef = childComponentFactory
                .create(this.injector);
              // we need to recreate the cliche action component with content
              viewContainerRef.clear();
              componentRef = viewContainerRef.createComponent(
                componentFactory,
                0,
                this.injector,
                [[childComponentRef.location.nativeElement]]
              );
              // pass inputs
              childComponentRef.instance.actionInstance =
                val.inputs.actionInstance;
              childComponentRef.instance.actionIO = val.inputs.actionIO;
              // detect changes since Angular doesn't expect inputs like this
              childComponentRef.instance.ref.detectChanges();
              // trigger lifecylce hooks, which would have already fired
              childComponentRef.instance.ngOnInit();
              childComponentRef.instance.ngAfterViewInit();
            } else {
              componentRef.instance[input] = val;
            }
          })
      );
    });

    // pass the instance for the text action
    if (this.shouldPassActionInstance()) {
      componentRef.instance['actionInstance'] = this.actionInstance;
    }

    // necessary since this may have been instantiated dynamically
    this.ref.detectChanges();
  }
}
