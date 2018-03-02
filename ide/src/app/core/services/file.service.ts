import { Injectable } from '@angular/core';
import { NgZone} from '@angular/core';
declare const electron: any;

/**
 * Service for loading, storing and deleting files via ipcRenderer to
 * communicate to electron's main.js.
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

  save(dir, filename, content) {
    this.ipcRenderer.send('save', {
      dir: dir,
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

  delete(dir, filename) {
    this.ipcRenderer.send('delete', {
      dir: dir,
      filename: filename
    });
  }

  onDeleteSuccess(callback) {
    this.ipcRenderer.on('delete-success', (event, data) => {
      this.zone.run(() => {
        callback(event, data);
      });
    });
  }

  read(dir) {
    this.ipcRenderer.send('read', {dir: dir});
  }

  onReadSuccess(callback) {
    this.ipcRenderer.on('read-success', (event, data) => {
      this.zone.run(() => {
        callback(event, data);
      });
    });
  }
}
