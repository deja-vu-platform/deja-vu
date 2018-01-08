import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { Project } from '../models/project/project';
import { Widget } from '../models/widget/widget';

@Injectable()
export class ProjectService {
  private selectedProject: Project;

  selectedWidget = new ReplaySubject<Widget>(1);
  widgetUpdateListener = new ReplaySubject<boolean>(1);

  public updateProject(project: Project) {
    this.selectedProject = project;
  }

  public getProject(): Project {
    if (this.selectedProject) {
      return this.selectedProject;
    }
    const project = localStorage.getItem('project');
    if (project) {
      this.updateProject(Project.fromObject(JSON.parse(project)));
    }
    return this.selectedProject;
  }

  public deleteProject() {
    this.selectedProject = undefined;
  }

  updateSelectedWidget(newSelectedWidget: Widget) {
    this.selectedWidget.next(newSelectedWidget);
    this.widgetUpdated();
  }

  widgetUpdated() {
    this.widgetUpdateListener.next(true);
  }
}
