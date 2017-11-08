import { Injectable } from '@angular/core';

import { Project } from '../models/project/project';

@Injectable()
export class ProjectCommunicatorService {
  selectedProject: Project;

  public updateProject(project: Project) {
    this.selectedProject = project;
  }

  public getProject(): Project {
    return this.selectedProject;
  }

  public deleteProject() {
    this.selectedProject = undefined;
  }
}
