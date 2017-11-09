import { Component, OnInit } from '@angular/core';

import { BaseWidget, UserWidget, Widget } from './models/widget/widget';
import { ProjectService } from './services/project.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private selectedWidget =
    new UserWidget('test', { height: 600, width: 800 }, '1234');
  private allWidgets = new Map<string, Map<string, Widget>>();

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    // Currently for testing
    // We create a main widget, give it some nester (inner) widgets
    // and give them some interesting sizes and positions.
    this.selectedWidget.updatePosition({ top: 100, left: 300 });
    Widget.addWidgetToAllWidgets(this.allWidgets, this.selectedWidget);
    const innerWidget1 =
      new BaseWidget('test inner1', 
        { height: 100, width: 200 }, 'img', '/', '1234');
    innerWidget1.addWidgetToAllWidgets(this.allWidgets);
    this.selectedWidget.addInnerWidget(innerWidget1.getId());
    innerWidget1.updatePosition({ top: 50, left: 100 });

    const innerWidget2 =
      new UserWidget('test inner2', { height: 200, width: 400 }, '1234');
    innerWidget2.addWidgetToAllWidgets(this.allWidgets);
    this.selectedWidget.addInnerWidget(innerWidget2.getId());
    innerWidget2.updatePosition({ top: 200, left: 200 });

    const innerWidget21 = 
      new UserWidget('test inner21', { height: 100, width: 100 }, '1234');
    innerWidget21.addWidgetToAllWidgets(this.allWidgets);
    innerWidget2.addInnerWidget(innerWidget21.getId());
    innerWidget21.updatePosition({ top: 50, left: 100 });

    this.projectService.updateAllWidgets(this.allWidgets);
    this.projectService.updateSelectedWidget(this.selectedWidget);
  }
}
