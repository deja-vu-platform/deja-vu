import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';

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

  private currentZoom = 1;
  private visibleWindowScroll: Position;

  constructor(
    private stateService: StateService,
    private projectService: ProjectService,
    private ref: ChangeDetectorRef
  ) {
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

    projectService.selectedWidget.subscribe((newSelectedWidget) => {
      this.selectedWidget = newSelectedWidget;
    });
  }

  ngAfterViewInit() {
    $('.work-surface').droppable({
      accept: 'dv-widget, dv-list-item',
      hoverClass: 'highlight',
      tolerance: 'fit',
      drop: (event, ui) => {
        if (!this.selectedWidget.isUserType()) {
          // non-user widgets can't be added to.
          return;
        }
        // Check if it's a new widget
        let newWidget: Widget = ui.helper.dvWidget;
        const isNew = ui.helper.new;
        console.log(ui);
        // if the new widget is a base type, create a new
        // widget object.
        if (newWidget && isNew) {
          if (newWidget.isBaseType()) {
            const project = this.projectService.getProject();
            const userApp = project.getUserApp();
            // Set the cliche id of the dummy widget to this
            // app id, so that the widget's id is set properly
            // when copying.
            newWidget.setClicheId(userApp.getId());
            newWidget = newWidget.makeCopy()[0];
            newWidget.setProject(project);

            const offset = this.selectedWidget.getPosition();
            newWidget.updatePosition({
              top: ui.position.top - offset.top,
              left: ui.position.left - offset.left
            });

            userApp.addUsedWidget(newWidget);
            this.selectedWidget.addInnerWidget(newWidget);
            this.projectService.widgetUpdated();
          }
        }
        this.onDropFinished(newWidget.getId());
      }
    });

    $('dv-worksurface').scroll((event: Event) => {
      const jqo = $('dv-worksurface');
      this.stateService.updateVisibleWindowScrollPosition({
        top: jqo.scrollTop(),
        left: jqo.scrollLeft()
      });
    });
  }

  onDropFinished(id/** TODO */) {
    if (this.selectedWidget.isUserType()) {
      this.selectedWidget.putInnerWidgetOnTop(id);
      if (!this.ref['destroyed']) { // Hack to prevent view destroyed errors
        this.ref.detectChanges();
      }
    }
  }
}
