import { Component, OnInit, ViewChild } from '@angular/core';

import { Dimensions, Position } from './utility/utility';
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

  /**
   * This is the visible part of the worksurface.
   */
  visibleWindowDimensions: Dimensions = {
    width: 800,
    height: 500
  };

  /**
   * Related to the visible part of the worksurface, it is its current
   * scroll position.
   */
  visibleWindowScrollPosition: Position = {
    top: 0,
    left: 0
  };

  /**
   * This is the screen size the user is making an app for. This currently does
   * not play a big role in this app.
   */
  screenDimensions: Dimensions = {
    width: 2000,
    height: 1000
  };


  selectedWidget = new UserWidget('test', { height: 600, width: 800 }, '1234');
  allWidgets = new Map<string, Map<string, Widget>>();

  /**
   * Handles when any of the widgets in the app changes (i.e., resize
   * or changing positions).
   */
  handleWidgetChange() {
    // Currently just updates the map vies
    this.map.updateView();
  }

  ngOnInit() {
    // Currently for testing
    // We create a main widget, give it some nester (inner) widgets
    // and give them some interesting sizes and positions.
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
  }

  handleMapScroll(e) {
    console.log(e);
  }
}
