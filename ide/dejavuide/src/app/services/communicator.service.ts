import { Injectable } from '@angular/core';
declare const electron: any;

import { Project } from '../models/project/project';

@Injectable()
export class CommunicatorService {
  private ipcRenderer;

  constructor() {
    if (!electron) {
      const electronProxy = {
        ipcRenderer: {
          on: null,
          send: null
        }
      };

      this.ipcRenderer = electronProxy.ipcRenderer;
    } else {
      this.ipcRenderer = electron.ipcRenderer;
    }
  }

  saveToLocalStorage(project: Project) {
    const JSONObject = project.getSaveableJson();
    localStorage.setItem('project', JSON.stringify(JSONObject));
  }

  save(project: Project) {
    const JSONObject = project.getSaveableJson();
    this.saveToLocalStorage(project);
    this.ipcRenderer.send('save', {
      projectName: project.getName(),
      projectContents: JSONObject
    });
  }

  onSaveSuccess(callback) {
    this.ipcRenderer.on('save-success', callback);
  }

  delete(data) {
    this.ipcRenderer.send('delete', data);
  }

  onDeleteSuccess(callback) {
    this.ipcRenderer.on('delete-success', callback);
  }

  loadProjects() {
    this.ipcRenderer.send('load');
  }

  onLoadProjects(callback) {
    this.ipcRenderer.on('projects', callback);
  }
}
