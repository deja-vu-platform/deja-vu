// declare const electron: any;
const electron = {
  ipcRenderer: {
    on: null,
    send: null
  }
};
const ipcRenderer = electron.ipcRenderer;

import { Component, Input, Output, OnInit} from '@angular/core';
import { RouterService, PageType } from '../../../services/router.service';
import { ProjectService } from '../../../services/project.service';

interface PageInfo {
  title: string;
  type: PageType | null;
}

const pages: PageInfo[] = [
  {
    title: 'Projects',
    type: PageType.PROJECT_EXPLORER
  },
  {
    title: 'Cliches',
    type: null
  },
  {
    title: 'Widgets',
    type: PageType.UI_EDITOR
  },
  {
    title: 'Data',
    type: null
  }];

function getTitle(pageType: PageType): string {
  let title = 'Invalid Page';
  pages.forEach((page) => {
    if (page.type === pageType) {
      title = page.title;
    }
  });
  return title;
}

@Component({
  selector: 'dv-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isSavable: boolean;
  readonly dejavu = 'Déjà Vu';
  otherPages: PageInfo[];
  pageType = PageType.UI_EDITOR;
  pageTitle: string;

  constructor (
    private projectService: ProjectService,
    private routerService: RouterService) {
  }

  ngOnInit() {
    ipcRenderer.on('save-success', function(event) {
      console.log(event);
    });

    this.routerService.newPageType.subscribe((pageType) => {
      this.updateHeaderData(pageType);
    });

    this.handleRedirectClick(this.pageType);
  }

  handleRedirectClick(type: PageType) {
    const that = this;
    this.routerService.navigateTo(type).then((success) => {
      if (success) {
        that.updateHeaderData(type);
      }
    });
  }

  private updateHeaderData(type: PageType) {
    this.pageType = type;
    this.otherPages = pages.filter(page => page.type !== this.pageType);
    this.isSavable = (this.pageType === PageType.UI_EDITOR);
    this.pageTitle = getTitle(this.pageType);
  }

  save() {
    const selectedProject = this.projectService.getProject();
    if (selectedProject) {
      ipcRenderer.send('save', {
        projectName: selectedProject.getName(),
        projectContents: JSON.parse(JSON.stringify(selectedProject))
      });
    }
  }
}
