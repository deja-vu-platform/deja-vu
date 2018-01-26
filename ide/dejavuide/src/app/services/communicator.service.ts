import { Injectable } from '@angular/core';
import { NgZone} from '@angular/core';
declare const electron: any;

import { Project } from '../models/project/project';

@Injectable()
export class CommunicatorService {
  private ipcRenderer;

  // The zone brings this piece of code back into angular's zone
  // so that angular detects the changes properly
  constructor(private zone: NgZone) {
    if (!electron) {
      const fakeElectron = {
        ipcRenderer: {
          on: null,
          send: null
        }
      };

      this.ipcRenderer = fakeElectron.ipcRenderer;
    } else {
      this.ipcRenderer = electron.ipcRenderer;
    }
  }

  saveToLocalStorage(project: Project) {
    const JSONObject = Project.toJSON(project);
    localStorage.setItem('project', JSON.stringify(JSONObject));
  }

  save(project: Project) {
    const JSONObject = Project.toJSON(project);
    this.saveToLocalStorage(project);
    this.ipcRenderer.send('save', {
      projectName: project.getName(),
      projectContents: JSONObject
    });
  }

  onSaveSuccess(callback) {
    this.ipcRenderer.on('save-success', (event, data) => {
      this.zone.run(() => {
        callback(event, data);
      });
    });
  }

  delete(data) {
    this.ipcRenderer.send('delete', data);
  }

  onDeleteSuccess(callback) {
    this.ipcRenderer.on('delete-success', (event, data) => {
      this.zone.run(() => {
        callback(event, data);
      });
    });
  }

  loadProjects() {
    this.ipcRenderer.send('load');
  }

  onLoadProjects(callback) {
    this.ipcRenderer.on('projects', (event, data) => {
      this.zone.run(() => {
        callback(event, data);
      });
    });
  }
}
