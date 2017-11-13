import { Component, AfterViewInit } from '@angular/core';

import { Widget, WidgetMap } from '../../../models/widget/widget';
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
  selectedScreenDimensions: Dimensions;
  selectedWidget: Widget;

  private currentZoom = 1;
  private visibleWindowScroll: Position;

  constructor(
    private stateService: StateService,
    private projectService: ProjectService
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
        $('.visible-window').scrollTop(newScrollPosition.top);
        $('.visible-window').scrollLeft(newScrollPosition.left);
      });

    projectService.selectedWidget.subscribe((newSelectedWidget) => {
      this.selectedWidget = newSelectedWidget;
    });
  }


  ngAfterViewInit() {
    const that = this;
    $('.work-surface').droppable({
      accept: 'dv-widget',
      hoverClass: 'highlight',
      tolerance: 'fit',
      drop: function (event, ui) {
          that.onDropFinished();
      }
    });

    $('.visible-window').scroll((event: Event) => {
      const jqo = $('.visible-window');
      this.stateService.updateVisibleWindowScrollPosition({
        top: jqo.scrollTop(),
        left: jqo.scrollLeft()
      });
    });
  }

  onDropFinished(/** TODO */) {
    // If new widget, add to the selected widget
    // else, put it at the top
    console.log('dropped');
  }
}
