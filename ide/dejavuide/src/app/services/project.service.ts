import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { Project } from '../models/project/project';
import { Widget } from '../models/widget/widget';

@Injectable()
export class ProjectService {
  private selectedProject: Project;

  // TODO perhaps project and widget update listeners can be merged
  projectUpdateListener = new ReplaySubject<boolean>(1);

  selectedWidget = new ReplaySubject<Widget>(1);
  widgetUpdateListener = new ReplaySubject<boolean>(1);

  public updateProject(project: Project) {
    this.selectedProject = project;
  }

  public getProject(): Project {
    return this.selectedProject;
  }

  public deleteProject() {
    this.selectedProject = undefined;
  }

  updateSelectedWidget(newSelectedWidget: Widget) {
    this.selectedWidget.next(newSelectedWidget);
  }

  widgetUpdated() {
    this.widgetUpdateListener.next(true);
  }

  projectUpdated() {
    this.projectUpdateListener.next(true);
  }
}
