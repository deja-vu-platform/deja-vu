import { Component, Input, OnInit, ChangeDetectorRef, EventEmitter, Output, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ProjectDeleteDialogComponent } from './project_delete_dialog.component';
import { NewProjectDialogComponent } from './new_project_dialog.component';
import { RouterService, PageType } from '../../services/router.service';
import { ProjectService } from '../../services/project.service';
import { CommunicatorService } from '../../services/communicator.service';
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
    private projectService: ProjectService,
    private communicatorService: CommunicatorService,
    private zone: NgZone) {}

  ngOnInit() {
    this.loaderVisible = true;
    this.communicatorService.onLoadProjects((event, data) => {
      data.projects.forEach((projectInfo) => {
        const projectName = projectInfo[0];
        const content = JSON.parse(projectInfo[1]);
        this.projects[projectName] = content;
      });

      this.updateDisplayProjectList();
      this.loaderVisible = false;
      this.ref.detectChanges();
    });

    this.communicatorService.onDeleteSuccess((event) => {
      // TODO
      delete this.projects[event.projectName];
      this.updateDisplayProjectList();
      this.loaderVisible = false;
      this.ref.detectChanges();
      // TODO deal with if the project is your selected project
    });

    this.communicatorService.loadProjects();
  }

  handleNewProject() {
    const dialogRef = this.dialog.open(NewProjectDialogComponent, {
      width: '250px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newProject = new Project({name: result.name});
        this.loadProject(newProject);
      }
    });
  }

  currentProjectClicked() {
    // TODO
  }

  loadClicked(projectName) {
    const newProject = Project.fromJSON(this.projects[projectName]);
    this.loadProject(newProject);
  }

  handleDelete(projectName): void {
    this.zone.run(() => {
      const dialogRef = this.dialog.open(ProjectDeleteDialogComponent, {
        width: '250px',
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loaderVisible = true;
          this.deleteProject(projectName);
        }
      });
    });
  }

  private loadProject(project: Project) {
    project.updateAccess();
    this.projectService.updateProject(project);
    this.communicatorService.saveToLocalStorage(project);
    this.zone.run(() => {
      this.routerService.navigateTo(PageType.UI_EDITOR);
    });
  }

  private loadProjectList(recentSelected = true) {
    this.recentSelected = recentSelected;
    this.updateDisplayProjectList();
  }

  private deleteProject(projectName) {
    this.communicatorService.delete({projectName: projectName});
  }

  private updateDisplayProjectList() {
    const projectsToShow = [];
    const WEEK_IN_SEC = 604800000;
    const now = (new Date()).getTime();
    Object.keys(this.projects).forEach((projectName: string) => {
      const content = this.projects[projectName];
      const time = content.lastAccessed;
      if (!this.recentSelected || (now - time) < WEEK_IN_SEC) {
        // TODO this file shouldn't need to know the format of the content file
        projectsToShow.push(this.fileToDisplayProject(projectName, content.id, time));
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
