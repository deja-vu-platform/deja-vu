import { Component, AfterViewInit } from '@angular/core';

import { Widget } from '../../../models/widget/widget';
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
      accept: 'dv-widget',
      hoverClass: 'highlight',
      tolerance: 'fit',
      drop: (event, ui) => {
          this.onDropFinished();
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

  onDropFinished(/** TODO */) {
    // If new widget, add to the selected widget
    // else, put it at the top
    console.log('dropped');
  }
}
