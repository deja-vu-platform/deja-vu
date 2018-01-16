import { Component, AfterViewInit, ChangeDetectorRef, ElementRef, Input, OnDestroy } from '@angular/core';

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
export class WorkSurfaceComponent implements AfterViewInit, OnDestroy {
  /**
   * Dimensions of the screen the user is building an app for.
   */
  selectedScreenDimensions: Dimensions;
  @Input() selectedWidget: Widget;

  private elt: HTMLElement;
  private currentZoom = 1;
  private visibleWindowScroll: Position;
  private subscriptions = [];

  constructor(
    elt: ElementRef,
    private stateService: StateService,
    private projectService: ProjectService,
    private ref: ChangeDetectorRef
  ) {
    this.elt = elt.nativeElement;

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

  ngAfterViewInit() {
    this.makeWorksurfaceDroppable();

    // Since state service is shared
    this.stateService.updateVisibleWindowScrollPosition({
      top: 0, left: 0
    });

    $(this.elt).scroll((event: Event) => {
      const elt = $(this.elt);
      this.stateService.updateVisibleWindowScrollPosition({
        top: elt.scrollTop(),
        left: elt.scrollLeft()
      });
    });
  }


  private makeWorksurfaceDroppable() {
    $(this.elt).droppable({
      accept: 'dv-widget, .widget-component, dv-list-item',
      hoverClass: 'highlight',
      tolerance: 'touch',
      drop: (event, ui) => {
        let widget: Widget = ui.helper.dvWidget;
        if (!widget) {
          return;
        }
        if (widget === this.selectedWidget) {
          widget.updatePosition(this.oldWidgetNewPosition(ui));
        } else if (!this.selectedWidget.isUserType()) {
          // non-user widgets can't be added to.
          return;
        } else {
          const isTemplate = ui.helper.template;
          // Check if it's a new widget
          const isNew = ui.helper.new;
          if (isNew || isTemplate) {
            // create a new widget object.
            const project = this.projectService.getProject();
            const userApp = project.getUserApp();
            let innerWidgets: Widget[];
            if (isNew) {
              // Set the cliche id of the dummy widget to this
              // app id, so that the widget's id is set properly
              // when copying.
              const dummyWidget = widget;
              dummyWidget.setClicheId(userApp.getId());
              innerWidgets = widget.makeCopy();
              widget = innerWidgets[0];
              widget.setProject(project);
              // reset the dummy widget
              dummyWidget.setClicheId(undefined);
            } else {
              innerWidgets = widget.makeCopy(undefined, true);
              widget = innerWidgets[0];
            }

            widget.updatePosition(this.newWidgetNewPosition(ui));

            this.selectedWidget.setAsInnerWidget(widget);
          } else {
            // it must be an unused widget or an already added widget
            const alreadyAdded =
              inArray(widget.getId(), this.selectedWidget.getInnerWidgetIds());

            if (alreadyAdded) {
              widget.updatePosition(this.oldWidgetNewPosition(ui));
            } else {
              this.selectedWidget.setAsInnerWidget(widget);
              widget.updatePosition(this.newWidgetNewPosition(ui));
            }
          }
          this.selectedWidget.putInnerWidgetOnTop(widget);
        }

        this.projectService.widgetUpdated();
        this.ref.detectChanges();
      }
    });
  }

  private newWidgetNewPosition(ui): Position {
    const offset = this.selectedWidget.getPosition();
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
}
