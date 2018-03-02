import { Injectable } from '@angular/core';
// BehaviorSubject as opposed to Subject since we want an initial value right
// upon subscription
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Project } from '../models/project/project';
import { Widget, UserWidget } from '../models/widget/widget';
import { UserCliche } from '../models/cliche/cliche';

import { FileService } from './file.service';

import { getExtension } from '../utility/utility';

// file extension to save projects
const DV_EXT = 'dvp';
const DIR = 'projects';

@Injectable()
export class ProjectService {
  constructor(private fileService: FileService) {
    const project = localStorage.getItem('project');
    if (project) {
      this.updateProject(Project.fromJSON(JSON.parse(project)));
    }
  }

  selectedProject = new BehaviorSubject<Project>(undefined);

  selectedWidget = new BehaviorSubject<Widget>(undefined);
  userAppUpdateListener = new BehaviorSubject<boolean>(false);

  public loadProjectFiles() {
    this.fileService.read(DIR);
  }

  // call this only once to set the listener
  public onLoadProjectFiles(callback) {
    this.fileService.onReadSuccess((event, data) => {
      const files = data.files.filter(
        filedata => getExtension(filedata[0]) === DV_EXT);
      callback(files);
    });
  }

  // call this only once to set the listener
  public onDeleteProjectFile(callback) {
    this.fileService.onDeleteSuccess(callback);
  }

  public deleteProjectFile(filename) {
    this.fileService.delete('projects', filename);
  }

  public saveProject() {
    const project = this.selectedProject.getValue();
    if (!project) {
      return;
    }
    const JSONObject = Project.toJSON(project);
    this.saveToLocalStorage(project);
    this.fileService.save(DIR, this.projectNameToFilename(project.getName()), JSONObject);
  }

  public updateProject(project: Project) {
    this.selectedProject.next(project);
    this.saveToLocalStorage(project);
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

  private saveToLocalStorage(project: Project) {
    const JSONObject = Project.toJSON(project);
    localStorage.setItem('project', JSON.stringify(JSONObject));
  }

  private projectNameToFilename(projectName) {
    return projectName + '.' + DV_EXT;
  }
}
