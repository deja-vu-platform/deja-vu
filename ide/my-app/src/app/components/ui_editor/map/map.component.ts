import { Component, Input, Output, EventEmitter, AfterViewInit} from '@angular/core';

import {Widget, UserWidget, WidgetType} from '../../../models/widget/widget';
import {Dimensions, Position} from '../../common/utility/utility';

import 'jquery';
import 'jquery-ui-dist/jquery-ui';

declare var $: any;

@Component({
  selector: 'dv-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  @Input() set outerContainerScroll(value: Position) {
    this.scrollPosition.top = value.top * this.mapScale;
    this.scrollPosition.left = value.left * this.mapScale;

    this.mapPosition.top = this.scrollPosition.top;
    this.mapPosition.left = this.scrollPosition.left;
  }
  @Input() outerContainerDimensions: Dimensions = {
    height: 1,
    width: 1
  };
  @Input() set screenDimensions(value: Dimensions) {
    this._screenDimensions = value;
    const widthScale = this.dimensions.width / this._screenDimensions.width;
    const heightScale = this.dimensions.height / this._screenDimensions.height;

    this.mapScale = Math.min(widthScale, heightScale);
  }
  @Input() allWidgets: Map<string, Map<string, Widget>>;
  @Input() zoom = 1;

  @Input() set selectedWidget(value: Widget) {
    this._selectedWidget = value;
    const mapScale = this.mapScale;
    const allWidgets = this.allWidgets;
    const mapWidgetSizes = [];
    if (value.getWidgetType() === WidgetType.USER_WIDGET) {
      const widget = <UserWidget> value;
      widget.getInnerWidgetIds().forEach(function (innerWidgetId) {
        const innerWidget = widget
                              .getInnerWidget(allWidgets, innerWidgetId);
        const innerWidgetDimensions = innerWidget.getDimensions();
        const innerWidgetPosition = innerWidget.getPosition();
        mapWidgetSizes.push({
          left: innerWidgetPosition.left * mapScale,
          top: innerWidgetPosition.top * mapScale,
          width: innerWidgetDimensions.width * mapScale,
          height: innerWidgetDimensions.height * mapScale,
        });
      });
    }
    this.mapWidgetSizes = mapWidgetSizes;
  }

  @Output() newScrollPosition: EventEmitter<Position>;

  _selectedWidget: Widget;
  mapScale = .1;
  navDragging = false;
  scrollPosition: Position = {
    top: 0,
    left: 0
  };
  mapPosition: Position = {
    top: 0,
    left: 0
  };

  _screenDimensions: Dimensions;
  dimensions: Dimensions = {
    height: 120,
    width: 180
  };

  minimized = false;
  mapWidgetSizes: Dimensions[] = [];

  minimizeButtonClick() {
    this.minimized = !this.minimized;
  }

  mapClick(e: MouseEvent) {
    const posX = e.pageX - $('#map').offset().left + $('#map').scrollLeft();
    const posY = e.pageY - $('#map').offset().top + $('#map').scrollTop();

    this.newScrollPosition.emit({
      top: posY / this.mapScale,
      left: posX / this.mapScale
    });

    this.mapPosition = {
      top: Math.max(0, Math.min(posY, $('#map-full-area').height() - $('#map-position').height())),
      left: Math.max(0, Math.min(posX, $('#map-full-area').width() - $('#map-position').width())),
    };
  }

  ngAfterViewInit() {
    ($('#map-position')).draggable({
      containment: '#map-full-area',
      start: function(){
          this.navDragging = true;
      },
      stop: function(e, ui){
          this.navDragging = false;

          this.newScrollPosition.emit({
            top: ui.position.top / this.mapScale,
            left: ui.position.left / this.mapScale
          });
      },
    });
  }
}





