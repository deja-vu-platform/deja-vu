import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';

import { Widget, WidgetMap } from '../../../models/widget/widget';
import { Dimensions, Position } from '../../../utility/utility';
import { StateService } from '../../../services/state.service';
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
  @Input() currentZoom = 1;
  allWidgets: WidgetMap;

  selectedScreenDimensions: Dimensions;

  selectedWidget: Widget;

  constructor(
    private stateService: StateService,
    private projectService: ProjectService
  ) {
    stateService.selectedScreenDimensions
      .subscribe((newSelectedScreenDimensions) => {
        this.selectedScreenDimensions = newSelectedScreenDimensions;
      });

    projectService.allWidgets.subscribe((updatedAllWidgets) => {
      this.allWidgets = updatedAllWidgets;
    });

    projectService.selectedWidget.subscribe((newSelectedWidget) => {
      this.selectedWidget = newSelectedWidget;
    });
  }

  handleChange() {
    this.projectService.updateSelectedWidget(this.selectedWidget);
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
  }

  onDropFinished(/** TODO */) {
    // If new widget, add to the selected widget
    // else, put it at the top
    console.log('dropped');
  }
}
