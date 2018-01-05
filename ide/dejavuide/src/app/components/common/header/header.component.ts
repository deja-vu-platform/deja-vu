import { Component, Input, Output, OnInit} from '@angular/core';
import { RouterService, PageType } from '../../../services/router.service';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../models/project/project';
import { CommunicatorService } from '../../../services/communicator.service';

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
  pageType = PageType.PROJECT_EXPLORER;
  pageTitle: string;

  constructor (
    private projectService: ProjectService,
    private routerService: RouterService,
    private communicatorService: CommunicatorService) {
  }

  ngOnInit() {
    this.communicatorService.onSaveSuccess((event, data) => {
      console.log(event);
    });

    const project = localStorage.getItem('project');
    if (project) {
      if (!this.projectService.getProject()) {
        this.projectService.updateProject(Project.fromObject(JSON.parse(project)));
      }
      this.pageType = PageType.UI_EDITOR;
    } else {
      this.pageType = PageType.PROJECT_EXPLORER;
    }

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
      this.communicatorService.save(selectedProject);
    }
  }
}
