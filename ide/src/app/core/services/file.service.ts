import { Injectable } from '@angular/core';
import { NgZone} from '@angular/core';
declare const electron: any;

/**
 * Service for communicating with electron's main.js via ipcRenderer.
 * Reduces places where electron's ipc renderer has to be imported.
 */
@Injectable()
export class FileService {
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

  save(filename, content) {
    this.ipcRenderer.send('save', {
      filename: filename,
      content: content
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

  load() {
    this.ipcRenderer.send('load');
  }

  onLoad(callback) {
    this.ipcRenderer.on('projects', (event, data) => {
      this.zone.run(() => {
        callback(event, data);
      });
    });
  }
}
