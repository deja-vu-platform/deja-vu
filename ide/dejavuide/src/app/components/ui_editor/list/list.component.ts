import { Component, Input, OnInit } from '@angular/core';

import { Cliche, UserCliche, DvCliche } from '../../../models/cliche/cliche';
import { Widget, BaseWidget, UserWidget } from '../../../models/widget/widget';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'dv-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent {
  @Input() importedCliches: DvCliche[];
  userApp: UserCliche;
  pages: UserWidget[] = [];
  unusedWidgets: Widget[] = [];
  templates: Widget[] = [];

  constructor(private projectService: ProjectService) {
    projectService.projectUpdateListener.subscribe(() => {
      const project = projectService.getProject();
      this.userApp = project.getUserApp();
      this.userApp.getPageIds().forEach((pageId) => {
        this.pages.push(this.userApp.getWidget(pageId) as UserWidget);
      });
      this.userApp.getTemplateIds().forEach((pageId) => {
        this.templates.push(this.userApp.getWidget(pageId));
      });
      this.userApp.getUnusedWidgetIds().forEach((pageId) => {
        this.unusedWidgets.push(this.userApp.getWidget(pageId));
      });
    });
  }
}
