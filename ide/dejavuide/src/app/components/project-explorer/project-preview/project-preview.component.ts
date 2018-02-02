import { Component, Input, Output, OnInit, EventEmitter} from '@angular/core';

import { Project } from '../../../models/project/project';
import { UserCliche } from '../../../models/cliche/cliche';
import { Widget } from '../../../models/widget/widget';

@Component({
    selector: 'dv-project-preview',
    templateUrl: './project-preview.component.html',
    styleUrls: ['./project-preview.component.css']
  })
export class ProjectPreviewComponent  {
  _selectedProject: Project;
  selectedApp: UserCliche;
  pages: Widget[] = [];
  selectedPage: Widget;
  empty = false;

  @Output() projectSelected = new EventEmitter<Project>();
  @Input()
  set selectedProject(project: Project) {
    this._selectedProject = project;
    const app = project.getUserApp();
    this.selectedApp = app;
    this.pages = app.getPageIds().map(
      (id: string) => this.selectedApp.getWidget(id)
    );
    if (this.pages.length === 0) {
      this.empty = true;
      this.updatePageNumber(-1);
    } else {
      this.empty = false;
      this.updatePageNumber(0);
    }
  }

  currentZoom = 1;

  gridHeight;
  gridWidth;

  pageNumber = -1;

  swipe(direction: number) {
    const numPages = this.pages.length;

    if (numPages === 0) {
      return;
    }
    this.updatePageNumber((this.pageNumber + direction + numPages) % (numPages));
  }

  selectProject() {
    this.projectSelected.next(this._selectedProject);
  }

  private updatePageNumber(num: number) {
    this.pageNumber = num;
    if (num < 0) {
      this.selectedPage = undefined;
    } else {
      this.selectedPage = this.pages[this.pageNumber];
    }
  }
}
