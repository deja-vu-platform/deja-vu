import { Component, Input, Output, EventEmitter, AfterViewInit} from '@angular/core';

import {Widget, UserWidget, WidgetType, WidgetMap} from '../../../models/widget/widget';
import {Dimensions, Position} from '../../../utility/utility';

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
  @Input() set visibleWindowScrollPosition(value: Position) {
    this.scrollPosition.top = value.top * this.mapScale;
    this.scrollPosition.left = value.left * this.mapScale;

    this.mapVisibleWindowPosition.top = this.scrollPosition.top;
    this.mapVisibleWindowPosition.left = this.scrollPosition.left;
  }

  @Input() visibleWindowDimensions: Dimensions = {
    height: 1,
    width: 1
  };

  @Input() set screenDimensions(value: Dimensions) {
    this._screenDimensions = value;
    const widthScale = this.dimensions.width / this._screenDimensions.width;
    const heightScale = this.dimensions.height / this._screenDimensions.height;

    this.mapScale = Math.min(widthScale, heightScale);
  }

  get screenDimensions() {
    return this._screenDimensions;
  }

  @Input() allWidgets: WidgetMap;
  @Input() zoom = 1;

  @Input() set selectedWidget(value: Widget) {
    this._selectedWidget = value;
    this.updateView();
  }

  get selectedWidget() {
    return this._selectedWidget;
  }

  @Output() newScrollPosition = new EventEmitter<Position>();

  private _selectedWidget: Widget;
  mapScale = .1;
  private navDragging = false;
  scrollPosition: Position = {
    top: 0,
    left: 0
  };
  mapVisibleWindowPosition: Position = {
    top: 0,
    left: 0
  };

  private _screenDimensions: Dimensions;
  dimensions: Dimensions = {
    height: 120,
    width: 180
  };

  minimized = false;
  mapWidgetSizes: Dimensions[] = [];

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
    this.newScrollPosition.emit({
      top: posY / this.mapScale,
      left: posX / this.mapScale
    });

    const top =  Math.max(0, Math.min(posY, (this._screenDimensions.height - this.visibleWindowDimensions.height) * this.mapScale));
    const left =  Math.max(0, Math.min(posX, (this._screenDimensions.width - this.visibleWindowDimensions.width) * this.mapScale));

    // TODO remove later
    this.updateContainerScroll(top, left);

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
      start: function(){
        that.navDragging = true;
      },
      drag: function(e, ui) {
        that.updateContainerScroll(ui.position.top, ui.position.left);
      },
      stop: function(e, ui){
        that.navDragging = false;
        that.newScrollPosition.emit({
          top: ui.position.top / that.mapScale,
          left: ui.position.left / that.mapScale
        });

        // TODO remove later
        that.updateContainerScroll(ui.position.top, ui.position.left);
      },
    });

    $('.visible-window').scroll(function(event: Event) {
      that.mapVisibleWindowPosition.top = $(this).scrollTop() * that.mapScale;
      that.mapVisibleWindowPosition.left = $(this).scrollLeft() * that.mapScale;
    });
  }

  /**
   * Update the view of the map fresh from the info of the given widget.
   */
  updateView() {
    const mapScale = this.mapScale;
    const allWidgets = this.allWidgets;
    const selectedWidget = this._selectedWidget;
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

  /**
   * Reaches out to outside the map component and updates the scroll of a
   * visible window of the work surface.
   * TODO remove and pass it up to the correct component.
   * @param top
   * @param left
   */
  private updateContainerScroll(top, left) {
    $('.visible-window').scrollTop(top / this.mapScale);
    $('.visible-window').scrollLeft(left / this.mapScale);
  }
}
