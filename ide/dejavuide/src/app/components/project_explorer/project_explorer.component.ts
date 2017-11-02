const fs = require('fs');
const path = require('path');

import { Component, Input, OnInit } from '@angular/core';
import {MatDialog} from '@angular/material';

import {ProjectDeleteDialogComponent} from './project_delete_dialog.component';
import {projectsSavePath, projectNameToFilename, filenameToProjectName, isCopyOfFile} from '../../utility/utility';

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
  projectsByName = {};

  loaderVisible = true;
  recentSelected = true;

  projectsToShow: DisplayProject[] = [];

  componentToShow;

  constructor(public dialog: MatDialog) {}

  ngOnInit() {
    const that = this;
    this.readFiles(projectsSavePath, function(filename, content) {
      // TODO add a loading projects sign
      // Check the types to only add projects
      content = JSON.parse(content);
      if (content.objectType && (content.objectType === 'UserProject')) {
        const projectName = filenameToProjectName(filename);
        that.projectsByName[projectName] = content;
      }
    }, function(err) {
        if (err) {
          throw err;
        }
        that.updateDisplayProjectList();
        that.loaderVisible = false;
    });
  }

  currentProjectClicked() {
    // TODO
  }

  loadProjectList() {
    this.recentSelected = false;
    this.updateDisplayProjectList();
  }

  loadClicked(projectName) {
    // TODO
  }

  handleDelete(projectName): void {
    const dialogRef = this.dialog.open(ProjectDeleteDialogComponent, {
      width: '250px',
    });

    const that = this;
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        that.loaderVisible = true;
        that.deleteProject(projectName, () => {
          delete that.projectsByName[projectName];
          that.updateDisplayProjectList();
          // TODO deal with if the project is your selected project
        });
      }
    });
  }

  private deleteProject(projectName, onFinish) {
    const filename = projectNameToFilename(projectName);
    const pathName = path.join(projectsSavePath, filename);
    fs.stat(pathName, function (err1, stats) {
        if (err1) {
          console.error(err1);
          return;
        }
        fs.unlink(pathName, (err2) => {
            if (err2) {
              console.log(err2);
              return;
            }
            onFinish();
        });
    });
  }

  private updateDisplayProjectList() {
    this.projectsToShow = [];
    const WEEK_IN_SEC = 604800000;
    const now = (new Date()).getTime();
    const that = this;
    Object.keys(this.projectsByName).forEach((projectName: string) => {
      const content = this.projectsByName[projectName];
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

  // from http://stackoverflow.com/questions/10049557/reading-all-files-in-a-directory-store-them-in-objects-and-send-the-object
  private readFiles(dirname, onFileContent, onFinish) {
    fs.readdir(
      dirname,
      (err1, filenames) => {
        if (err1) {
            onFinish(err1);
            return;
        }
        let numFilesProcessed = 0;
        filenames.forEach((filename) => {
            fs.readFile(
              path.join(dirname, filename),
              'utf-8',
              (err2, content) => {
                if (err2) {
                    onFinish(err2);
                    return;
                }
                onFileContent(filename, content);
                numFilesProcessed++;
                if (numFilesProcessed === filenames.length) {
                    onFinish(null);
                }
            });
        });
    });
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
