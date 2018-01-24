import { Component, OnInit, AfterViewInit, ElementRef, Input, OnDestroy, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute, ParamMap } from '@angular/router';
import 'rxjs/add/operator/map';

import { Widget, LabelBaseWidget, LinkBaseWidget } from '../../../models/widget/widget';
import { Cliche } from '../../../models/cliche/cliche';
import { Dimensions, Position, StateService } from '../../../services/state.service';
import { ProjectService } from '../../../services/project.service';

import { inArray } from '../../../utility/utility';

import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;

@Component({
  selector: 'dv-worksurface',
  templateUrl: './worksurface.component.html',
  styleUrls: ['./worksurface.component.css']
})
export class WorkSurfaceComponent implements OnInit, AfterViewInit, OnDestroy {
  /**
   * Dimensions of the screen the user is building an app for.
   */
  selectedScreenDimensions: Dimensions;
  selectedWidget$: Observable<string>;

  selectedWidgetId: string;

  activeWidgets: Widget[] = [];

  private el: HTMLElement;
  private currentZoom = 1;
  private visibleWindowScroll: Position;
  private subscriptions = [];

  constructor(
    private route: ActivatedRoute,
    elt: ElementRef,
    private stateService: StateService,
    private projectService: ProjectService,
    private zone: NgZone
  ) {
    this.el = elt.nativeElement;

    this.subscriptions.push(stateService.zoom.subscribe((newZoom) => {
      this.currentZoom = newZoom;
    }));

    this.subscriptions.push(stateService.selectedScreenDimensions
      .subscribe((newSelectedScreenDimensions) => {
        this.selectedScreenDimensions = newSelectedScreenDimensions;
      }));

    this.subscriptions.push(stateService.visibleWindowScrollPosition
      .subscribe((newScrollPosition) => {
        this.visibleWindowScroll = newScrollPosition;
        const jqo = $('dv-worksurface');
        jqo.scrollTop(newScrollPosition.top);
        jqo.scrollLeft(newScrollPosition.left);
      }));
  }

  ngOnInit() {
    this.selectedWidget$ = this.route.paramMap.map((params: ParamMap) => {
      this.selectedWidgetId = params.get('id');

      const activeWidgetIds = this.activeWidgets.map(widget => widget.getId());
      const alreadyAdded = inArray(this.selectedWidgetId, activeWidgetIds);

      const userApp = this.projectService.getProject().getUserApp();
      const widget = userApp.getWidget(this.selectedWidgetId);
      if (!alreadyAdded) {
        this.activeWidgets.push(widget);
      }

      this.projectService.updateSelectedWidget(widget);
      // Since state service is shared
      this.stateService.updateVisibleWindowScrollPosition({
        top: 0, left: 0
      });
      return this.selectedWidgetId;
    });
  }

  ngAfterViewInit() {
    this.handleWindowResize();
    this.makeWorksurfaceDroppable();


    $(this.el).scroll((event: Event) => {
      const elt = $(this.el);
      this.stateService.updateVisibleWindowScrollPosition({
        top: elt.scrollTop(),
        left: elt.scrollLeft()
      });
    });
  }


  private makeWorksurfaceDroppable() {
    $(this.el).droppable({
      accept: 'dv-widget, .widget-component, dv-list-item',
      hoverClass: 'highlight',
      tolerance: 'touch',
      drop: (event, ui) => {
        // The zone brings this piece of code back into angular's zone
        // so that angular detects the changes properly
        this.zone.run(() => {
          this.onDrop(event, ui);
        });
      }
    });
  }

  private onDrop(event, ui) {
    let widget: Widget = ui.helper.dvWidget;

    const project = this.projectService.getProject();
    const userApp = project.getUserApp();

    const selectedWidget = userApp.getWidget(this.selectedWidgetId);
    if (!widget) {
      return;
    }
    if (widget === selectedWidget) {
      widget.updatePosition(this.oldWidgetNewPosition(ui));
    } else if (!selectedWidget.isUserType()) {
      // non-user widgets can't be added to.
      return;
    } else {
      const isTemplate = ui.helper.template;
      // Check if it's a new widget
      const isNew = ui.helper.new;
      if (isNew || isTemplate) {
        // create a new widget object.
        let innerWidgets: Widget[];
        if (isNew) {
          // Set the cliche id of the dummy widget to this
          // app id, so that the widget's id is set properly
          // when copying.
          const dummyWidget = widget;
          dummyWidget.setClicheId(userApp.getId());
          innerWidgets = widget.makeCopy(userApp);
          widget = innerWidgets[0];
          // reset the dummy widget
          dummyWidget.setClicheId(undefined);
        } else {
          innerWidgets = widget.makeCopy(userApp, undefined, true);
          widget = innerWidgets[0];
        }

        widget.updatePosition(this.newWidgetNewPosition(ui, selectedWidget));

        selectedWidget.setAsInnerWidget(userApp, widget);
      } else {
        // it must be an unused widget or an already added widget
        const alreadyAdded =
          inArray(widget.getId(), selectedWidget.getInnerWidgetIds());

        if (alreadyAdded) {
          widget.updatePosition(this.oldWidgetNewPosition(ui));
        } else {
          selectedWidget.setAsInnerWidget(userApp, widget);
          widget.updatePosition(this.newWidgetNewPosition(ui, selectedWidget));
        }
      }
      selectedWidget.putInnerWidgetOnTop(userApp, widget);
    }

    this.projectService.userAppUpdated();
  }

  private newWidgetNewPosition(ui, selectedWidget: Widget): Position {
    const offset = selectedWidget.getPosition();
    return {
      top: ui.position.top - offset.top,
      left: ui.position.left - offset.left
    };
  }

  private oldWidgetNewPosition(ui): Position {
    return ui.position;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
    console.log('destroyed');
  }

  handleWindowResize() {
    const windowjq = $(window);

    const windowSize = {
      height: windowjq.height(),
      width: windowjq.width()
    };
    const newSize = {
      height: windowSize.height - 60,
      width: windowSize.width - 250
    };
    this.el.style.height = newSize.height + 'px';
    this.el.style.width = newSize.width + 'px';
    console.log('resizing');
    // Without setTimeout causes an
    // ExpressionChangedAfterItHasBeenCheckedError
    // setTimeout(() => {
      this.stateService.updateVisibleWindowDimensions(newSize);
    // }, 0);
  }


  private update(id?) {

  }
}
