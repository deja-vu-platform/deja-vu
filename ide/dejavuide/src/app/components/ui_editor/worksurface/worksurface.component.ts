import { Component, AfterViewInit, ChangeDetectorRef, ElementRef } from '@angular/core';

import { Widget, LabelBaseWidget, LinkBaseWidget } from '../../../models/widget/widget';
import { Cliche } from '../../../models/cliche/cliche';
import { Dimensions, Position, StateService } from '../../../services/state.service';
import { ProjectService } from '../../../services/project.service';

import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;

@Component({
  selector: 'dv-worksurface',
  templateUrl: './worksurface.component.html',
  styleUrls: ['./worksurface.component.css']
})
export class WorkSurfaceComponent implements AfterViewInit {
  /**
   * Dimensions of the screen the user is building an app for.
   */
  selectedScreenDimensions: Dimensions;
  selectedWidget: Widget;
  newFlag = false;

  private elt: HTMLElement;
  private currentZoom = 1;
  private visibleWindowScroll: Position;

  constructor(
    elt: ElementRef,
    private stateService: StateService,
    private projectService: ProjectService,
    private ref: ChangeDetectorRef
  ) {
    this.elt = elt.nativeElement;

    stateService.zoom.subscribe((newZoom) => {
      this.currentZoom = newZoom;
    });

    stateService.selectedScreenDimensions
      .subscribe((newSelectedScreenDimensions) => {
        this.selectedScreenDimensions = newSelectedScreenDimensions;
      });

    stateService.visibleWindowScrollPosition
      .subscribe((newScrollPosition) => {
        this.visibleWindowScroll = newScrollPosition;
        const jqo = $('dv-worksurface');
        jqo.scrollTop(newScrollPosition.top);
        jqo.scrollLeft(newScrollPosition.left);
      });
  }

  ngAfterViewInit() {
    this.projectService.selectedWidget.subscribe((newSelectedWidget) => {
      console.log('work surface widget change listener');
      this.selectedWidget = newSelectedWidget;
      this.reinitChildComponent();
    });

    this.makeWorksurfaceDroppable();

    $(this.elt).scroll((event: Event) => {
      const elt = $(this.elt);
      this.stateService.updateVisibleWindowScrollPosition({
        top: elt.scrollTop(),
        left: elt.scrollLeft()
      });
    });
  }

  reinitChildComponent() {
    this.newFlag = false;
    this.ref.detectChanges();
    this.newFlag = true;
    this.ref.detectChanges();
  }

  private makeWorksurfaceDroppable() {
    $(this.elt).droppable({
      accept: 'dv-widget, dv-list-item',
      hoverClass: 'highlight',
      tolerance: 'fit',
      drop: (event, ui) => {
        if (!this.selectedWidget.isUserType()) {
          // non-user widgets can't be added to.
          return;
        }
        // Check if it's a new widget
        let widget: Widget = ui.helper.dvWidget;
        if (!widget) {
          return;
        }
        const isNew = ui.helper.new;
        // if the new widget is a base type, create a new
        // widget object.
        if (isNew) {
          if (widget.isBaseType()) {
            const project = this.projectService.getProject();
            const userApp = project.getUserApp();
            // Set the cliche id of the dummy widget to this
            // app id, so that the widget's id is set properly
            // when copying.
            const dummyWidget = widget;
            dummyWidget.setClicheId(userApp.getId());
            widget = widget.makeCopy()[0];
            widget.setProject(project);
            // reset the dummy widget
            dummyWidget.setClicheId(undefined);
            widget.updatePosition(this.newWidgetNewPosition(ui));

            userApp.addUnusedWidget(widget);
            this.selectedWidget.addInnerWidget(widget);
          }
        } else {
          // it must be an unused widget or an already added widget
          const alreadyAdded = (this.selectedWidget.getInnerWidgetIds().indexOf(widget.getId()) >= 0);

          if (alreadyAdded) {
            widget.updatePosition(this.oldWidgetNewPosition(ui));
          } else {
            this.selectedWidget.addInnerWidget(widget);
            widget.updatePosition(this.newWidgetNewPosition(ui));
          }
        }

        this.selectedWidget.putInnerWidgetOnTop(widget);
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

}
