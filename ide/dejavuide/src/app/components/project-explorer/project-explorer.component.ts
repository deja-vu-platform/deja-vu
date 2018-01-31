import { Component, OnInit, OnDestroy} from '@angular/core';

import { MatDialog } from '@angular/material';

import { ProjectDeleteDialogComponent } from './project-delete-dialog.component';
import { NewProjectDialogComponent } from './new-project-dialog.component';
import { RouterService, PageType } from '../../services/router.service';
import { ProjectService } from '../../services/project.service';
import { CommunicatorService } from '../../services/communicator.service';
import { Project } from '../../models/project/project';

interface DisplayProject {
  filename: string;
  name: string;
  id: string;
  isSelectedProject: boolean;
  readableDate: string;
  readableTime: string;
}

@Component({
  selector: 'dv-project-explorer',
  templateUrl: './project-explorer.component.html',
  styleUrls: ['./project-explorer.component.css']
})
export class ProjectExplorerComponent implements OnInit, OnDestroy {
  private selectedProject;
  projects = {};

  loaderVisible = false;
  recentSelected = true;

  projectsToShow: DisplayProject[] = [];

  private subscriptions = [];

  constructor(
    public dialog: MatDialog,
    private routerService: RouterService,
    private projectService: ProjectService,
    private communicatorService: CommunicatorService) {}

  ngOnInit() {
    this.loaderVisible = true;
    this.communicatorService.onLoadProjects((event, data) => {
      data.projects.forEach((projectInfo) => {
        const filename = projectInfo[0];
        const content = JSON.parse(projectInfo[1]);
        this.projects[filename] = content;
      });

      this.updateDisplayProjectList();
      this.loaderVisible = false;
    });

    this.communicatorService.onDeleteSuccess((event, data) => {
      // TODO deal with if the project is your selected project
      delete this.projects[data.filename];

      this.updateDisplayProjectList();
      this.loaderVisible = false;
    });

    this.communicatorService.loadProjects();
  }

  handleNewProject() {
    const dialogRef = this.dialog.open(NewProjectDialogComponent, {
      width: '250px',
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const newProject = new Project({name: result.name});
          this.loadProject(newProject);
        }
      }));
  }

  currentProjectClicked() {
    // TODO
  }

  loadClicked(filename: string) {
    const newProject = Project.fromJSON(this.projects[filename]);
    this.loadProject(newProject);
  }

  handleDelete(filename: string): void {
    const dialogRef = this.dialog.open(ProjectDeleteDialogComponent, {
      width: '250px',
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loaderVisible = true;
          this.deleteProject(filename);
        }
      }));
  }

  private loadProject(project: Project) {
    project.updateAccess();
    this.projectService.updateProject(project);
    this.communicatorService.saveToLocalStorage(project);
    this.routerService.navigateTo(PageType.UI_EDITOR);
  }

  loadProjectList(recentSelected = true) {
    this.recentSelected = recentSelected;
    this.updateDisplayProjectList();
  }

  private deleteProject(filename) {
    this.communicatorService.delete({filename: filename});
  }

  private updateDisplayProjectList() {
    const projectsToShow = [];
    const WEEK_IN_SEC = 604800000;
    const now = (new Date()).getTime();
    Object.keys(this.projects).forEach((filename: string) => {
      const content = this.projects[filename];
      const time = content.lastAccessed;
      if (!this.recentSelected || (now - time) < WEEK_IN_SEC) {
        const name = Project.getName(content);
        const id = Project.getId(content);
        projectsToShow.push(this.fileToDisplayProject(filename, name, id, time));
      }
    });
    this.projectsToShow = projectsToShow;
  }

  private fileToDisplayProject(filename, projectName, id, lastAccessed): DisplayProject {
    const lastAccessDate = new Date(lastAccessed);
    const currentProject = this.projectService.getProject();
    return {
      filename: filename,
      name: projectName,
      id: id,
      isSelectedProject:
        (currentProject ? (id === currentProject.getId()) : false),
      readableDate: lastAccessDate.toLocaleDateString(),
      readableTime: lastAccessDate.toLocaleTimeString()
    };
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  projectClicked(filename: string) {
    this.selectedProject = Project.fromJSON(this.projects[filename]);
  }
}
