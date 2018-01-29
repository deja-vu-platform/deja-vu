import { Component, Input, OnInit } from '@angular/core';

import { Project } from '../../../models/project/project';
import { UserCliche } from '../../../models/cliche/cliche';
import { Widget } from '../../../models/widget/widget';

@Component({
    selector: 'dv-project-preview',
    templateUrl: './project-preview.component.html',
    styleUrls: ['./project-preview.component.css']
  })
export class ProjectPreviewComponent  {
  selectedApp: UserCliche;
  pages: Widget[] = [];
  empty = false;

  @Input()
  set selectedProject(project: Project) {
    const app = project.getUserApp();
    this.selectedApp = app;
    this.pages = app.getPageIds().map(
      (id: string) => this.selectedApp.getWidget(id)
    );
    if (this.pages.length === 0) {
      this.empty = true;
      this.pageNumber = -1;
    } else {
      this.empty = false;
      this.pageNumber = 0;
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

    this.pageNumber = (this.pageNumber + direction + numPages) % (numPages);
  }
}




// $('#page-preview').on('dblclick', '#main-table-preview', function(){
//     // this div's existance means there is some project showing

//    selectedProject = availableProjectsByFilename[$('#page-preview').data('projectfilename')];
//    selectedProject.lastAccessed = new Date();
//    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
//    window.location = 'index.html';
// });
