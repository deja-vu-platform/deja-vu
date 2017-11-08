declare const electron: any;
const ipcRenderer = electron.ipcRenderer;

import { Component, OnInit } from '@angular/core';

import { Project } from './models/project/project';

export enum PageType {
  PROJECT_EXPLORER, UI_EDITOR
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  PageType = PageType;
  selectedPage = PageType.PROJECT_EXPLORER;
  selectedProject: Project;

  ngOnInit() {
    ipcRenderer.on('save-success', function(event) {
      console.log(event);
    });
  }

  selectPage(pageType: PageType) {
    if (pageType === PageType.UI_EDITOR) {
      if (this.selectedProject) {
        this.selectedPage = pageType;
      }
    } else {
      this.selectedPage = pageType;
    }
  }

  handleProjectChosen(project: Project) {
    this.selectedProject = project;
    this.selectedPage = PageType.UI_EDITOR;
  }

  save() {
    ipcRenderer.send('save', {
      projectName: this.selectedProject.getName(),
      projectContents: JSON.parse(JSON.stringify(this.selectedProject))
    });
  }
}
