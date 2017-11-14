import { Component, AfterViewInit, ElementRef} from '@angular/core';

import { Widget, UserWidget, WidgetMap } from '../../../models/widget/widget';
import { StateService, Dimensions, Position } from '../../../services/state.service';
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
  /**
   * This is a box corresponding to the visible window of the user's
   * work surface to show where the user is.
   */
  visibleWindowDimensions: Dimensions = {
    height: 0,
    width: 0
  };

  selectedWidget: Widget;
  mapScale = .1;
  mapVisibleWindowPosition: Position = {
    top: 0,
    left: 0
  };

  screenDimensions: Dimensions;
  mapComponentDimensions: Dimensions = {
    height: 0,
    width: 0
  };

  minimized = false;
  mapWidgetSizes: Dimensions[] = [];

  private zoom = 1;

  constructor(
    private stateService: StateService,
    private projectService: ProjectService
  ) {
    stateService.zoom.subscribe((newZoom) => {
      this.zoom = newZoom;
    });

    stateService.selectedScreenDimensions
      .subscribe((newSelectedScreenDimensions) => {
        this.screenDimensions = newSelectedScreenDimensions;
        this.updateMapScale();
      });

    stateService.visibleWindowDimensions
      .subscribe((newVisibleWindowDimensions) => {
        this.visibleWindowDimensions.height =
          newVisibleWindowDimensions.height;
        this.visibleWindowDimensions.width =
          newVisibleWindowDimensions.width;
      });

    stateService.visibleWindowScrollPosition
      .subscribe((newVisibleWindowScrollPosition) => {
        this.mapVisibleWindowPosition.top =
          newVisibleWindowScrollPosition.top * this.mapScale;
        this.mapVisibleWindowPosition.left =
          newVisibleWindowScrollPosition.left * this.mapScale;
      });

    projectService.selectedWidget.subscribe((newSelectedWidget) => {
      this.selectedWidget = newSelectedWidget;
      this.updateView();
    });

    projectService.widgetUpdateListener.subscribe(() => {
      this.updateView();
    });
  }

  ngAfterViewInit() {
    // I can't get it from el.nativeElement.style
    this.mapComponentDimensions.height = $('dv-map').height();
    this.mapComponentDimensions.width = $('dv-map').width();
    this.updateMapScale();
    this.updateView();

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
        (this.screenDimensions.height -
          this.visibleWindowDimensions.height) * this.mapScale));
    const left =  Math.max(0,
      Math.min(posX,
        (this.screenDimensions.width -
          this.visibleWindowDimensions.width) * this.mapScale));

    this.mapVisibleWindowPosition = {
      top: top,
      left: left
    };
  }

  /**
   * Update the view of the map fresh from the info of the given widget.
   */
  private updateView() {
    const mapScale = this.mapScale;
    const selectedWidget = this.selectedWidget;
    const mapWidgetSizes = [];
    if (selectedWidget) {
      if (selectedWidget.isUserType()) {
        selectedWidget.getInnerWidgetIds().forEach(function (innerWidgetId) {
          const innerWidget = selectedWidget
                                .getInnerWidget(innerWidgetId);
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

  updateMapScale() {
    const widthScale =
    this.mapComponentDimensions.width / this.screenDimensions.width;
    const heightScale =
      this.mapComponentDimensions.height / this.screenDimensions.height;

    this.mapScale = Math.min(widthScale, heightScale);
  }
}
