const fs = require('fs');
const path = require('path');

import { Component, Input, OnInit } from '@angular/core';

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
  availableProjectsByFilename = {};
  availableProjectsByAccessTime = {};
  recentProjectsByAccessTime = {};

  loaderVisible = true;
  recentSelected = true;

  projectsToShow: DisplayProject[] = [];

  componentToShow;

  ngOnInit() {
    this.readFiles(projectsSavePath, function(filename, content) {
      // TODO add a loading projects sign
      // Check the types to only add projects
      content = JSON.parse(content);
      if (content.objectType && (content.objectType === 'UserProject')) {
        this.availableProjectsByFilename[filename] = content;

        // TODO for now, recent is one week
        const lastAccessed = content.lastAccessed;
        const now = (new Date()).getTime();
        this.availableProjectsByAccessTime[lastAccessed] = {
          content: content,
          filename: filename
        };

        if ((now - lastAccessed) < 604800000) { // two weeks is 1209600000
          this.recentProjectsByAccessTime[lastAccessed] = {
            content: content,
            filename: filename
          };
        }
      }
    }, function(err) {
        if (err) {
          throw err;
        }
        displayRecentProjects();
        this.loaderVisible = false;
    });
  }

  currentProjectClicked() {
    // TODO
  }

  recentClicked() {
    this.recentSelected = true;
    //  displayRecentProjects();
  }

  allClicked() {
    this.recentSelected = false;
    //  displayAllProjects();
  }

  loadClicked(projectName) {
    // TODO
  }

  deleteClicked(projectName) {
    // TODO
    this.openDeleteProjectConfirmDialogue(dirname, filename, id);
  }

  private fileToDisplayProject(filename, id, lastAccessed): DisplayProject {
    const lastAccessDate = new Date(lastAccessed);
    return {
      name: filenameToProjectName(filename),
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

// TODO on project name input *check* for special chars
// TODO something about rewriting existing files?
// TODO on project name input *check* for name being reused

$('#create-project').on('click', function () {
    selectedProject = initNewProject();
    resetMenuOptions();
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));

    window.location = 'index.html';
});

/**
 * Creates a new Project based on user inputs
 * @param isDefault
 * @constructor
 */
function initNewProject() {
    var projectName = sanitizeStringOfSpecialChars($('#new-project-name').val());
    var version = $('#project-version').val();
    var author = $('#project-author').val();

    // create a copy instead
    var copyName = projectName;
    var copyNum = 0;
    // TODO should give user warning or options
    while(isCopyOfFile(projectsSavePath, copyName+'.json')){
        if (copyNum == 0){
            copyName = projectName + ' - Copy';
        } else {
            copyName = projectName + ' - Copy ' + copyNum;
        }
        copyNum++;
    }
    var newProject = new UserProject(copyName);
    return newProject;
}

/**
 * Resets the menu options to their default values
 */
function resetMenuOptions() {
    $('#new-project-name').val('');
    $('#project-version').val('');
    $('#project-author').val('');

    $('#project-json').val('');
}


function deleteFile(dirname, filename){
    var pathName = path.join(dirname, filename);
    fs.stat(pathName, function (err, stats) {
        if (err) {
            return console.error(err);
        }
        fs.unlink(pathName,function(err){
            if(err) return console.log(err);
        });
    });
}


function deleteFileAndDisplay(dirname, filename, id){
    deleteFile(dirname, filename);
    $(".recent-projects").find("[data-filename='" + filename + "']").parent().remove();

    // todo refresh lists

    if (currentProject){
        if (currentProject.meta.id === id){
            currentProject = null;
            window.sessionStorage.removeItem('selectedProject');
            $('.current-project .content').html('')
            $('.current-project').css('display', 'none');
            $('#page-preview').html('');
            $('#project-name-preview').text('Project Preview')
        }
    }
}

function openDeleteProjectConfirmDialogue(dirname, filename, id){
    $('#confirm-delete-project').modal('show');

    var projectName = utils.filenameToProjectName(filename);
    $('#delete-project-name').text(projectName);

    $('#delete-project-btn').unbind();
    $('#delete-project-btn').click(function(){
        deleteFileAndDisplay(dirname, filename, id);

        $('#delete-project-name').text('');
        $('#confirm-delete-project').modal('hide');

    });

    $('#delete-project-cancel-btn').click(function(){
        $('#delete-project-name').text('');
        $('#confirm-delete-project').modal('hide');

    });

    $('#confirm-delete-project .close').click(function(event){
        event.preventDefault();

        $('#delete-project-name').text('');
        $('#confirm-delete-project').modal('hide');
    });

}

function displayRecentProjects(){
    $('#recent-projects-list').html('');
    var lastAccessedTimes = Object.keys(recentProjectsByAccessTime);
    lastAccessedTimes.sort().reverse();
    for (var i = 0; i<lastAccessedTimes.length; i++){
        var lastAccessed = parseInt(lastAccessedTimes[i]);
        var filename = recentProjectsByAccessTime[lastAccessed].filename;
        var content = recentProjectsByAccessTime[lastAccessed].content;
        showProjectInList(filename, content.meta.id, lastAccessed);
        addLoadProjectButton(filename);
        addDeleteProjectButton(projectsSavePath, filename, content.meta.id);
    }
}


function displayAllProjects(){
    $('#recent-projects-list').html('');
    var lastAccessedTimes = Object.keys(availableProjectsByAccessTime);
    lastAccessedTimes.sort().reverse();
    for (var i = 0; i<lastAccessedTimes.length; i++){
        var lastAccessed = parseInt(lastAccessedTimes[i]);
        var filename = availableProjectsByAccessTime[lastAccessed].filename;
        var content = availableProjectsByAccessTime[lastAccessed].content;
        showProjectInList(filename, content.meta.id, lastAccessed);
        addLoadProjectButton(filename);
        addDeleteProjectButton(projectsSavePath, filename, content.meta.id);
    }
}
