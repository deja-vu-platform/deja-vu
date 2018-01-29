import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { Project } from '../models/project/project';
import { Widget, UserWidget } from '../models/widget/widget';
import { UserCliche } from '../models/cliche/cliche';

@Injectable()
export class ProjectService {
  private selectedProject: Project;

  selectedWidget = new ReplaySubject<Widget>(1);
  userAppUpdateListener = new ReplaySubject<boolean>(1);

  public updateProject(project: Project) {
    this.selectedProject = project;
  }

  public getProject(): Project {
    if (this.selectedProject) {
      return this.selectedProject;
    }
    const project = localStorage.getItem('project');
    if (project) {
      this.updateProject(Project.fromJSON(JSON.parse(project)));
    }
    return this.selectedProject;
  }

  public deleteProject() {
    this.selectedProject = undefined;
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
