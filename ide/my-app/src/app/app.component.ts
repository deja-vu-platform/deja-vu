import { Component, OnInit } from '@angular/core';

import { Dimensions } from './components/common/utility/utility';
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
    width: 400,
    height: 200
  };

  selectedWidget = new UserWidget('test', { height: 150, width: 250 }, '1234');
  allWidgets = new Map<string, Map<string, Widget>>();

  ngOnInit() {
    Widget.addWidgetToAllWidgets(this.allWidgets, this.selectedWidget);
    const innerWidget = new BaseWidget('test inner', { height: 50, width: 75 }, 'img', '/', '1234');
    innerWidget.addWidgetToAllWidgets(this.allWidgets);
    this.selectedWidget.addInnerWidget(innerWidget.getId());
    this.selectedWidget.updateInnerWidgetLayout(innerWidget.getId(),
      { top: 20, left: 30 });
  }
}
