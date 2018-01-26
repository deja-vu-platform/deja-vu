import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { Project } from '../models/project/project';
import { Widget } from '../models/widget/widget';

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

  getUserApp() {
    const project = this.getProject();
    if (project) {
      return project.getUserApp();
    }
  }

  getWidgets(widgetIds: string[]) {
    const userApp = this.getUserApp();
    return widgetIds.map(widgetId => userApp.getWidget(widgetId));
  }
}
