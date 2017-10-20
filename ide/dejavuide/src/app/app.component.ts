import { Component, OnInit } from '@angular/core';

import { Dimensions, Position } from './components/common/utility/utility';
import { BaseWidget, Widget, UserWidget } from './models/widget/widget';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
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

  selectedWidget = new UserWidget('test', { height: 300, width: 400 }, '1234');
  allWidgets = new Map<string, Map<string, Widget>>();

  ngOnInit() {
    this.selectedWidget.updatePosition({ top: 100, left: 300 });
    Widget.addWidgetToAllWidgets(this.allWidgets, this.selectedWidget);
    const innerWidget = new BaseWidget('test inner', { height: 100, width: 200 }, 'img', '/', '1234');
    innerWidget.addWidgetToAllWidgets(this.allWidgets);
    this.selectedWidget.addInnerWidget(innerWidget.getId());
    innerWidget.updatePosition({ top: 50, left: 100 });

    // setTimeout(() => {
    //   this.outerContainerScroll = {
    //     top: 100,
    //     left: 100
    //   };
    // }, 1000);
  }
}
