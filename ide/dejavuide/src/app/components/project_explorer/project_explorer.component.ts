// import * as fs from 'fs';
// const path = require('path');
// import { ipcRenderer } from 'electron';
declare const electron: any;
const ipcRenderer = electron.ipcRenderer;

import { Component, Input, OnInit } from '@angular/core';
import {MatDialog} from '@angular/material';

import {ProjectDeleteDialogComponent} from './project_delete_dialog.component';

interface DisplayProject {
  name: string;
  isSelectedProject: boolean;
  readableDate: string;
  readableTime: string;
}

@Component({
  selector: 'dv-project-explorer',
  templateUrl: './project_explorer.component.html',
  styleUrls: ['./project_explorer.component.css']
})
export class ProjectExplorerComponent implements OnInit {
  @Input() currentProject;

  private selectedProject;
  projects = {};

  loaderVisible = true;
  recentSelected = true;

  projectsToShow: DisplayProject[] = [];

  componentToShow;

  constructor(public dialog: MatDialog) {}

  ngOnInit() {
    console.log(electron);
    console.log(electron.ipcRenderer);
    const that = this;
    ipcRenderer.on('projects', function(event, data) {
      console.log(data.projects);
      data.projects.forEach((projectInfo) => {
        const projectName = projectInfo[0];
        const content = JSON.parse(projectInfo[1]);
        if (content.objectType && (content.objectType === 'UserProject')) {
          that.projects[projectName] = content;
        }
      });

      that.updateDisplayProjectList();
      that.loaderVisible = false;
    });

    ipcRenderer.on('delete-success', function(event) {
      // TODO
      that.updateDisplayProjectList();
      that.loaderVisible = false;
    });

    ipcRenderer.on('save-success', function(event) {
      // TODO
      that.updateDisplayProjectList();
      that.loaderVisible = false;
    });

    ipcRenderer.send('load');
  }

  currentProjectClicked() {
    // TODO
  }

  loadProjectList(recentSelected = true) {
    this.recentSelected = recentSelected;
    this.updateDisplayProjectList();
  }

  loadClicked(projectName) {
    // TODO
    console.log('load clicked');
  }

  handleDelete(projectName): void {
    console.log('delete clicked');
    const dialogRef = this.dialog.open(ProjectDeleteDialogComponent, {
      width: '250px',
    });

    const that = this;
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        that.loaderVisible = true;
        that.deleteProject(projectName, () => {
          delete that.projects[projectName];
          that.updateDisplayProjectList();
          // TODO deal with if the project is your selected project
        });
      }
    });
  }

  private deleteProject(projectName, onFinish) {
    ipcRenderer.send('delete', {projectName: projectName});
  }

  private updateDisplayProjectList() {
    this.projectsToShow = [];
    const WEEK_IN_SEC = 604800000;
    const now = (new Date()).getTime();
    const that = this;
    Object.keys(this.projects).forEach((projectName: string) => {
      const content = this.projects[projectName];
      const time = parseInt(content.accessTime, 10);
      if (!that.recentSelected || (now - time) < WEEK_IN_SEC) {
        that.projectsToShow.push(that.fileToDisplayProject(projectName, content.meta.id, time));
      }
    });
  }

  private fileToDisplayProject(projectName, id, lastAccessed): DisplayProject {
    const lastAccessDate = new Date(lastAccessed);
    return {
      name: projectName,
      isSelectedProject:
        (this.currentProject ? (id === this.currentProject.getId()) : false),
      readableDate: lastAccessDate.toLocaleDateString(),
      readableTime: lastAccessDate.toLocaleTimeString()
    };
  }
}


// /**
//  * Creates a new Project based on user inputs
//  * @param isDefault
//  * @constructor
//  */
// function initNewProject() {
//     var projectName = sanitizeStringOfSpecialChars($('#new-project-name').val());
//     var version = $('#project-version').val();
//     var author = $('#project-author').val();

//     // create a copy instead
//     var copyName = projectName;
//     var copyNum = 0;
//     // TODO should give user warning or options
//     while(isCopyOfFile(projectsSavePath, copyName+'.json')){
//         if (copyNum == 0){
//             copyName = projectName + ' - Copy';
//         } else {
//             copyName = projectName + ' - Copy ' + copyNum;
//         }
//         copyNum++;
//     }
//     var newProject = new UserProject(copyName);
//     return newProject;
// }

/**
 * Resets the menu options to their default values
 */
function resetMenuOptions() {
    $('#new-project-name').val('');
    $('#project-version').val('');
    $('#project-author').val('');

    $('#project-json').val('');
}

// function deleteFileAndDisplay(dirname, filename, id){
//     deleteFile(dirname, filename);
//     $(".recent-projects").find("[data-filename='" + filename + "']").parent().remove();

//     // todo refresh lists

//     if (currentProject){
//         if (currentProject.meta.id === id){
//             currentProject = null;
//             window.sessionStorage.removeItem('selectedProject');
//             $('.current-project .content').html('')
//             $('.current-project').css('display', 'none');
//             $('#page-preview').html('');
//             $('#project-name-preview').text('Project Preview')
//         }
//     }
// }

// $('#create-project').on('click', function () {
//     selectedProject = initNewProject();
//     resetMenuOptions();
//     window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));

//     window.location = 'index.html';
// });
