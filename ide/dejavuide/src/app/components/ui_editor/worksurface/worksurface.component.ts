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
    if (this.selectedWidget.isUserType()) {
      $('.work-surface').droppable({
        accept: 'dv-widget, dv-list-item',
        hoverClass: 'highlight',
        tolerance: 'fit',
        drop: (event, ui) => {
          let newWidget: Widget = ui.helper.dvWidget;
          if (newWidget && newWidget.isBaseType()
                && this.selectedWidget.isUserType()) {
            const project = this.projectService.getProject();
            const userApp = project.getUserApp();
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
            if (!this.ref['destroyed']) { // Hack to prevent view destroyed errors
              this.ref.detectChanges();
            }
          }
          // this.onDropFinished();
        }
      });
    }

    $('dv-worksurface').scroll((event: Event) => {
      const jqo = $('dv-worksurface');
      this.stateService.updateVisibleWindowScrollPosition({
        top: jqo.scrollTop(),
        left: jqo.scrollLeft()
      });
    });
  }

  // onDropFinished(/** TODO */) {
  //   // If new widget, add to the selected widget
  //   // else, put it at the top
  //   console.log('dropped');
  // }
}
