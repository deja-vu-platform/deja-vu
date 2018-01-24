import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';

import { Cliche, UserCliche, DvCliche } from '../../../models/cliche/cliche';
import { Widget, BaseWidget, UserWidget, LinkBaseWidget, LabelBaseWidget, ImageBaseWidget } from '../../../models/widget/widget';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'dv-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  @Input() importedCliches: DvCliche[];
  userApp: UserCliche;
  pages: UserWidget[] = [];
  unusedWidgets: Widget[] = [];
  templates: Widget[] = [];

  baseWidgets: Widget[] = [
    new LinkBaseWidget({}),
    new LabelBaseWidget({}),
    new ImageBaseWidget({})
  ];

  constructor(private ref: ChangeDetectorRef,
    private projectService: ProjectService) {}

  ngOnInit() {
    this.refreshList();
    this.projectService.userAppUpdateListener.subscribe(() => {
      this.refreshList();
    });
  }

  private refreshList() {
    const project = this.projectService.getProject();
    this.userApp = project.getUserApp();
    this.pages = [];
    this.unusedWidgets = [];
    this.templates = [];
    this.userApp.getPageIds().forEach((pageId) => {
      this.pages.push(this.userApp.getWidget(pageId) as UserWidget);
    });
    this.userApp.getTemplateIds().forEach((pageId) => {
      this.templates.push(this.userApp.getWidget(pageId));
    });
    this.userApp.getFreeWidgetIds().forEach((pageId) => {
      this.unusedWidgets.push(this.userApp.getWidget(pageId));
    });
    this.ref.detectChanges();
  }

  newPage() {
    const project = this.projectService.getProject();
    const newWidget = new UserWidget(
      {name: 'new page',
      dimensions: {height: 500, width: 500},
      clicheId: this.userApp.getId()});
    this.userApp.addWidget(newWidget);
    this.userApp.setAsPage(newWidget);
    this.refreshList();
  }

  newWidget() {
    const project = this.projectService.getProject();
    const newWidget = new UserWidget(
      {name: 'new widget',
      dimensions: {height: 100, width: 100},
      clicheId: this.userApp.getId()});
    this.userApp.addWidget(newWidget);
    this.refreshList();
  }
}
