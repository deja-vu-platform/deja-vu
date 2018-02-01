import { Injectable } from '@angular/core';
// BehaviorSubject as opposed to Subject since we want an initial value right
// upon subscription
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Project } from '../models/project/project';
import { Widget, UserWidget } from '../models/widget/widget';
import { UserCliche } from '../models/cliche/cliche';

@Injectable()
export class ProjectService {
  constructor() {
    const project = localStorage.getItem('project');
    if (project) {
      this.updateProject(Project.fromJSON(JSON.parse(project)));
    }
  }

  selectedProject = new BehaviorSubject<Project>(undefined);

  selectedWidget = new BehaviorSubject<Widget>(undefined);
  userAppUpdateListener = new BehaviorSubject<boolean>(false);

  public updateProject(project: Project) {
    this.selectedProject.next(project);
  }

  public getProject(): Project {
    return this.selectedProject.getValue();
  }

  updateSelectedWidget(newSelectedWidget: Widget) {
    this.selectedWidget.next(newSelectedWidget);
  }

  userAppUpdated() {
    this.userAppUpdateListener.next(true);
  }

  /** Convenience functions */

  getUserApp(): UserCliche {
    const project = this.getProject();
    if (project) {
      return project.getUserApp();
    }
  }

  getWidgets(widgetIds: string[]) {
    const userApp = this.getUserApp();
    return userApp.getWidgets(widgetIds);
  }

  deleteWidget(widget: Widget) {
    const userApp = this.getUserApp();
    this.unlinkWidget(widget);
    userApp.removeWidget(widget.getId());
  }

  unlinkWidget(widget: Widget) {
    const userApp = this.getUserApp();
    const parent = this.getParentWidget(widget);
    if (parent) {
      parent.unlinkInnerWidget(userApp, widget.getId());
    }
  }

  getParentWidget(widget: Widget): UserWidget {
    const parentId = widget.getParentId();
    if (parentId) {
      return this.getUserApp().getWidget(parentId) as UserWidget;
    }
  }
}
