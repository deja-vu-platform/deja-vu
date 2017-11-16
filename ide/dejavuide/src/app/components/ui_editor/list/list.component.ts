import { Component, Input, OnInit } from '@angular/core';

import { Cliche, UserCliche, DvCliche, ClicheMap } from '../../../models/cliche/cliche';
import { Widget, BaseWidget, UserWidget } from '../../../models/widget/widget';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'dv-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  @Input() userApp: UserCliche;
  @Input() importedCliches: DvCliche[];

  pages: UserWidget[] = [];
  unusedWidget: Widget[] = [];
  templates: Widget[] = [];
  allCliches: ClicheMap;

  constructor(private projectService: ProjectService) {
    projectService.allCliches.subscribe((allCliches) => {
      this.allCliches = allCliches;
    });
  }

  ngOnInit() {
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
