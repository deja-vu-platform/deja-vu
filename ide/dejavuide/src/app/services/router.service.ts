import { Injectable } from '@angular/core';

import { Project } from '../models/project/project';
import { Router } from '@angular/router';
import { ReplaySubject } from 'rxjs/ReplaySubject';

export enum PageType {
  PROJECT_EXPLORER, UI_EDITOR
}

const pageToUrl: Map<PageType, string> = new Map([
  [PageType.PROJECT_EXPLORER, '/projects'],
  [PageType.UI_EDITOR, '/ui_editor']
]);

@Injectable()
export class RouterService {
  private selectedProject: Project;
  private selectedPageType: PageType;
  newPageType = new ReplaySubject<PageType>(1);

  constructor(private router: Router) {
  }

  public updateProject(project: Project) {
    this.selectedProject = project;
  }

  public getProject(): Project {
    return this.selectedProject;
  }

  public deleteProject() {
    this.selectedProject = undefined;
  }

  public navigateTo(pageType: PageType): Promise<boolean> {
    if (this.canNavigateTo(pageType)) {
      this.selectedPageType = pageType;
      this.newPageType.next(this.selectedPageType);
      return this.router.navigate([pageToUrl.get(pageType)]);
    }
    return new Promise<boolean>(() => false);
  }

  public getSelectedPageType(): PageType {
    return this.selectedPageType;
  }

  private canNavigateTo(pageType: PageType): boolean {
    if (pageType === PageType.UI_EDITOR) {
      if (!this.selectedProject) {
        return false;
      }
    }
    return true;
  }
}
