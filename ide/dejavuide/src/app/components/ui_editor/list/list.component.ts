import { Component, Input, OnInit } from '@angular/core';

import {Cliche, UserCliche, DvCliche} from '../../../models/cliche/cliche';
import {Widget, BaseWidget, UserWidget, WidgetType} from '../../../models/widget/widget';

@Component({
  selector: 'dv-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  @Input() userApp: UserCliche;
  @Input() importedCliches: DvCliche[];
  @Input() allCliches: Map<string, Cliche>;

  pages: UserWidget[] = [];
  unusedWidget: Widget[] = [];
  templates: Widget[] = [];

  ngOnInit() {
    console.log(this.userApp);

    this.userApp.getPageIds().forEach((pageId) => {
      this.pages.push(<UserWidget>Widget.getWidget(this.allCliches, pageId));
    });

    this.userApp.getTemplateIds().forEach((pageId) => {
      this.templates.push(Widget.getWidget(this.allCliches, pageId));
    });

    this.userApp.getUnusedWidgetIds().forEach((pageId) => {
      this.unusedWidget.push(Widget.getWidget(this.allCliches, pageId));
    });
  }
}
