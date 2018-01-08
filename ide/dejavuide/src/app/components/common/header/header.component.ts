import { Component, Input, Output, OnInit} from '@angular/core';
import { RouterService, PageType, PageInfo } from '../../../services/router.service';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../models/project/project';
import { CommunicatorService } from '../../../services/communicator.service';


@Component({
  selector: 'dv-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isSavable: boolean;
  readonly dejavu = 'Déjà Vu';
  otherPages: PageInfo[];
  page: PageInfo;

  constructor (
    private projectService: ProjectService,
    private routerService: RouterService,
    private communicatorService: CommunicatorService) {
  }

  ngOnInit() {
    this.communicatorService.onSaveSuccess((event, data) => {
      console.log(event);
    });

    this.page = this.routerService.getSelectedPage();

    this.routerService.newPageType.subscribe((pageType) => {
      this.updateHeaderData(pageType);
    });

    // TODO should this be somewhere else?
    this.handleRedirectClick(this.page.type);
  }

  handleRedirectClick(type: PageType) {
    this.routerService.navigateTo(type).then((success) => {
      if (success) {
        this.updateHeaderData(type);
      }
    });
  }

  save() {
    const selectedProject = this.projectService.getProject();
    if (selectedProject) {
      this.communicatorService.save(selectedProject);
    }
  }

  private updateHeaderData(type: PageType) {
    this.page = this.routerService.getPageInfo(type);
    this.otherPages = this.routerService.getOtherPages(type);
    this.isSavable = this.routerService.isSaveable(type);
  }
}
