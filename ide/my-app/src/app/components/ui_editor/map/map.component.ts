import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';

import {Widget, UserWidget, WidgetType} from '../../../models/widget/widget';
import {Dimensions, Position} from '../../common/utility/utility';

// declare var $: any;

@Component({
  selector: 'dv-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnChanges {
  @Input() containerScroll: Position = {
    top: 0,
    left: 0
  };
  @Input() outerContainerDimensions: Dimensions = {
    height: 1,
    width: 1
  };
  @Input() screenDimensions: Dimensions;
  @Input() allWidgets: Map<string, Map<string, Widget>>;
  @Input() zoom = 1;

  @Input() widget: Widget;

  mapScale = .1;
  navDragging = false;
  scrollPosition: Position;
  mapPosition: Position;

  dimensions: Dimensions = {
    height: 120,
    width: 180
  };

  minimized = false;
  mapWidgetSizes: Dimensions[] = [];

  ngOnChanges(changes: SimpleChanges) {
    const widthScale = this.dimensions.width / this.screenDimensions.width;
    const heightScale = this.dimensions.height / this.screenDimensions.height;

    this.mapScale = Math.min(widthScale, heightScale);

    console.log(this.allWidgets);
    console.log(this.widget.getDimensions());

    const mapScale = this.mapScale;
    const allWidgets = this.allWidgets;
    const mapWidgetSizes = [];
    if (this.widget.getWidgetType() === WidgetType.USER_WIDGET) {
      const widget = <UserWidget> this.widget;
      const layouts = widget.getInnerWidgetLayouts();
      widget.getInnerWidgetIds().forEach(function (innerWidgetId) {
        const innerWidget = widget
                              .getInnerWidget(allWidgets, innerWidgetId);
        const innerWidgetDimensions = innerWidget.getDimensions();
        mapWidgetSizes.push({
          left: layouts[innerWidgetId].left * mapScale,
          top: layouts[innerWidgetId].top * mapScale,
          width: innerWidgetDimensions.width * mapScale,
          height: innerWidgetDimensions.height * mapScale,
        });
      });
    }
    this.mapWidgetSizes = mapWidgetSizes;
  }


  getMapScale = function () {
    return this.mapScale;
  };

  private showMiniNavPosition() {
    this.scrollPosition.top = this.containerScroll.top * this.mapScale;
    this.scrollPosition.left = this.containerScroll.left * this.mapScale;

    this.mapPosition.top = this.scrollPosition.top;
    this.mapPosition.left = this.scrollPosition.left;
  }

  // $('#outer-container').on('scroll', function(){
  //     if (!navDragging) {
  //         showMiniNavPosition();
  //     }
  // })

  minimizeButtonClick() {
    this.minimized = !this.minimized;
  }

  mapClick(e: MouseEvent) {
    // const posX = e.pageX - $('#map').offset().left + $('#map').scrollLeft();
    // const posY = e.pageY - $('#map').offset().top + $('#map').scrollTop();
    // $('#outer-container').scrollTop(posY / this.mapScale);
    // $('#outer-container').scrollLeft(posX / this.mapScale);

    // this.mapPosition = {
    //   top: Math.min(posY, $('#map-full-area').height() - $('#map-position').height()),
    //   left: Math.min(posX, $('#map-full-area').width() - $('#map-position').width()),
    // };
  }

  // $('#map-position').draggable({
  //     containment: '#map-full-area',
  //     start: function(){
  //         navDragging = true;
  //     },
  //     drag: function(e, ui){
  //         const posX = ui.position.left;
  //         const posY = ui.position.top;
  //         $('#outer-container').scrollTop(posY / this.mapScale);
  //         $('#outer-container').scrollLeft(posX / this.mapScale);
  //         showMiniNavPosition();
  //     },
  //     stop: function(){
  //         navDragging = false;
  //     },
  // });
}





