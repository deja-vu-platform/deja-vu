declare const electron: any;
const ipcRenderer = electron.ipcRenderer;

import { Component, Input, OnInit, ChangeDetectorRef, EventEmitter, Output, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ProjectDeleteDialogComponent } from './project_delete_dialog.component';
import { NewProjectDialogComponent } from './new_project_dialog.component';
import { RouterService, PageType } from '../../services/router.service';
import { Project } from '../../models/project/project';

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

  loaderVisible = false;
  recentSelected = true;

  projectsToShow: DisplayProject[] = [];

  componentToShow;

  constructor(
    public dialog: MatDialog,
    private ref: ChangeDetectorRef,
    private routerService: RouterService,
    private zone: NgZone) {}

  ngOnInit() {
    const that = this;
    this.loaderVisible = true;
    ipcRenderer.on('projects', function(event, data) {
      data.projects.forEach((projectInfo) => {
        const projectName = projectInfo[0];
        const content = JSON.parse(projectInfo[1]);
        if (content.objectType && (content.objectType === 'Project')) {
          that.projects[projectName] = content;
        }
      });

      that.updateDisplayProjectList();
      that.loaderVisible = false;
      if (!that.ref['destroyed']) { // Hack to prevent view destroyed errors
        that.ref.detectChanges();
      }
    });

    ipcRenderer.on('delete-success', function(event) {
      // TODO
      that.updateDisplayProjectList();
      that.loaderVisible = false;
      if (!that.ref['destroyed']) {
        that.ref.detectChanges();
      }
    });

    ipcRenderer.send('load');
  }

  handleNewProject() {
    const dialogRef = this.dialog.open(NewProjectDialogComponent, {
      width: '250px',
    });

    const that = this;
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newProject = new Project(result.name);
        that.routerService.updateProject(newProject);
        that.routerService.navigateTo(PageType.UI_EDITOR);
      }
    });

    // const newProject = new Project('result.name');
    // this.routerService.updateProject(newProject);
    // this.routerService.navigateTo(PageType.UI_EDITOR);
  }

  currentProjectClicked() {
    // TODO
  }

  loadProjectList(recentSelected = true) {
    this.recentSelected = recentSelected;
    this.updateDisplayProjectList();
  }

  loadClicked(projectName) {
    const newProject = Project.fromObject(this.projects[projectName]);
    this.routerService.updateProject(newProject);
    this.zone.run(() => {
      this.routerService.navigateTo(PageType.UI_EDITOR);
    });
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
    const projectsToShow = [];
    const WEEK_IN_SEC = 604800000;
    const now = (new Date()).getTime();
    const that = this;
    Object.keys(this.projects).forEach((projectName: string) => {
      const content = this.projects[projectName];
      const time = content.lastAccessed;
      if (!that.recentSelected || (now - time) < WEEK_IN_SEC) {
        projectsToShow.push(that.fileToDisplayProject(projectName, content.meta.id, time));
      }
    });
    this.projectsToShow = projectsToShow;
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
