import { Component, OnInit, ViewChild } from '@angular/core';

import { Dimensions, Position } from './components/common/utility/utility';
import { BaseWidget, Widget, UserWidget } from './models/widget/widget';
import { MapComponent } from './components/ui_editor/map/map.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild(MapComponent)
  private map: MapComponent;

  title = 'app';

  outerContainerDimensions: Dimensions = {
    width: 300,
    height: 200
  };

  screenDimensions: Dimensions = {
    width: 800,
    height: 700
  };

  outerContainerScroll: Position = {
    top: 0,
    left: 0
  };

  selectedWidget = new UserWidget('test', { height: 600, width: 800 }, '1234');
  allWidgets = new Map<string, Map<string, Widget>>();

  handleWidgetChange() {
    this.map.updateView();
  }

  ngOnInit() {
    this.selectedWidget.updatePosition({ top: 100, left: 300 });
    Widget.addWidgetToAllWidgets(this.allWidgets, this.selectedWidget);
    const innerWidget1 = new BaseWidget('test inner1', { height: 100, width: 200 }, 'img', '/', '1234');
    innerWidget1.addWidgetToAllWidgets(this.allWidgets);
    this.selectedWidget.addInnerWidget(innerWidget1.getId());
    innerWidget1.updatePosition({ top: 50, left: 100 });

    const innerWidget2 = new UserWidget('test inner2', { height: 200, width: 400 }, '1234');
    innerWidget2.addWidgetToAllWidgets(this.allWidgets);
    this.selectedWidget.addInnerWidget(innerWidget2.getId());
    innerWidget2.updatePosition({ top: 200, left: 200 });

    const innerWidget21 = new UserWidget('test inner21', { height: 100, width: 100 }, '1234');
    innerWidget21.addWidgetToAllWidgets(this.allWidgets);
    innerWidget2.addInnerWidget(innerWidget21.getId());
    innerWidget21.updatePosition({ top: 50, left: 100 });

    // setTimeout(() => {
    //   this.outerContainerScroll = {
    //     top: 100,
    //     left: 100
    //   };
    // }, 1000);
  }
}
