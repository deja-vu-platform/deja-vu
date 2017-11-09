import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';

import { Widget, UserWidget, WidgetType, WidgetMap } from '../../../models/widget/widget';
import { Dimensions, Position } from '../../../utility/utility';
import { StateService } from '../../../services/state.service';
import { ProjectService } from '../../../services/project.service';

// Maps needs drag-and-drop
import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;

@Component({
  selector: 'dv-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  mapVisibleWindowDimensions: Dimensions = {
    height: 1,
    width: 1
  };

  allWidgets: WidgetMap;
  @Input() zoom = 1;

  selectedWidget: Widget;
  mapScale = .1;
  mapVisibleWindowPosition: Position = {
    top: 0,
    left: 0
  };

  screenDimensions: Dimensions;
  mapComponentDimensions: Dimensions = {
    height: 120,
    width: 180
  };

  minimized = false;
  mapWidgetSizes: Dimensions[] = [];

  constructor(
    private stateService: StateService,
    private projectService: ProjectService
  ) {
    stateService.selectedScreenDimensions
      .subscribe((newSelectedScreenDimensions) => {
        this.screenDimensions = newSelectedScreenDimensions;
        const widthScale =
          this.mapComponentDimensions.width / this.screenDimensions.width;
        const heightScale =
          this.mapComponentDimensions.height / this.screenDimensions.height;

        this.mapScale = Math.min(widthScale, heightScale);
      });

    stateService.visibleWindowDimensions
      .subscribe((newVisibleWindowDimensions) => {
        this.mapVisibleWindowDimensions.height =
          newVisibleWindowDimensions.height * this.mapScale;
        this.mapVisibleWindowDimensions.width =
          newVisibleWindowDimensions.width * this.mapScale;
      });

    stateService.visibleWindowScrollPosition
      .subscribe((newVisibleWindowScrollPosition) => {
        this.mapVisibleWindowPosition.top =
          newVisibleWindowScrollPosition.top * this.mapScale;
        this.mapVisibleWindowPosition.left =
          newVisibleWindowScrollPosition.left * this.mapScale;
      });

    projectService.allWidgets.subscribe((updatedAllWidgets) => {
      this.allWidgets = updatedAllWidgets;
    });

    projectService.selectedWidget.subscribe((newSelectedWidget) => {
      this.selectedWidget = newSelectedWidget;
      this.updateView();
    });
  }


  minimizeButtonClick() {
    this.minimized = !this.minimized;
  }

  /**
   * Updates the position of the little screen element to start at the place
   * that was clicked, and also changes the window's scroll to match.
   * @param e
   */
  mapClick(e: MouseEvent) {
    const posX = e.pageX - $('#map').offset().left + $('#map').scrollLeft();
    const posY = e.pageY - $('#map').offset().top + $('#map').scrollTop();
    this.stateService.updateVisibleWindowScrollPosition({
      top: posY / this.mapScale,
      left: posX / this.mapScale
    });

    const top =  Math.max(0,
      Math.min(posY,
        this.screenDimensions.height * this.mapScale -
          this.mapVisibleWindowDimensions.height));
    const left =  Math.max(0,
      Math.min(posX,
        this.screenDimensions.width * this.mapScale -
          this.mapVisibleWindowDimensions.width));

    this.mapVisibleWindowPosition = {
      top: top,
      left: left
    };
  }

  ngAfterViewInit() {
    const that = this;
    // Initiate draggable
    $('#map-window').draggable({
      containment: '#zoom-selected-screen-size',
      drag: function(e, ui) {
        that.stateService.updateVisibleWindowScrollPosition({
          top: ui.position.top / that.mapScale,
          left: ui.position.left / that.mapScale
        });
      },
      stop: function(e, ui){
        that.stateService.updateVisibleWindowScrollPosition({
          top: ui.position.top / that.mapScale,
          left: ui.position.left / that.mapScale
        });
      },
    });
  }

  /**
   * Update the view of the map fresh from the info of the given widget.
   */
  updateView() {
    const mapScale = this.mapScale;
    const allWidgets = this.allWidgets;
    const selectedWidget = this.selectedWidget;
    const mapWidgetSizes = [];
    if (selectedWidget) {
      if (selectedWidget.getWidgetType() === WidgetType.USER_WIDGET) {
        const widget = <UserWidget> selectedWidget;
        widget.getInnerWidgetIds().forEach(function (innerWidgetId) {
          const innerWidget = widget
                                .getInnerWidget(allWidgets, innerWidgetId);
          const innerWidgetDimensions = innerWidget.getDimensions();
          const innerWidgetPosition = innerWidget.getPosition();
          mapWidgetSizes.push({
            left: innerWidgetPosition.left,
            top: innerWidgetPosition.top,
            width: innerWidgetDimensions.width,
            height: innerWidgetDimensions.height,
          });
        });
      }
    }
    this.mapWidgetSizes = mapWidgetSizes;
  }
}
