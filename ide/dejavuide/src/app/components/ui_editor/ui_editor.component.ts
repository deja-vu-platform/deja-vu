import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import { LabelBaseWidget, LinkBaseWidget, UserWidget } from '../../models/widget/widget';
import { Cliche, UserCliche } from '../../models/cliche/cliche';
import { Project } from '../../models/project/project';
import { Dimensions } from '../../services/state.service';
import { RouterService, PageType } from '../../services/router.service';
import { StateService } from '../../services/state.service';
import { ProjectService } from '../../services/project.service';

import * as jQuery from 'jquery';
const $ = <any>jQuery;

@Component({
  selector: 'dv-ui-editor',
  templateUrl: './ui_editor.component.html',
  styleUrls: ['./ui_editor.component.css']
})
export class UiEditorComponent implements OnInit, AfterViewInit {
  @ViewChild('worksurface', {read: ElementRef}) private worksurfaceElt: ElementRef;
  private windowSize: Dimensions;

  selectedProject: Project;
  private userApp: UserCliche;
  private selectedWidget: UserWidget;

  constructor (
    private projectService: ProjectService,
    private stateService: StateService,
    private routerService: RouterService) {
  }

  private updateWorksurfaceDimensions() {
    this.windowSize = {
      height: window.innerHeight,
      width: window.innerHeight
    };
    const newSize = {
      height: this.windowSize.height - 60,
      width: this.windowSize.width - 250
    };

    this.worksurfaceElt.nativeElement.style.height =
      newSize.height + 'px';
    this.worksurfaceElt.nativeElement.style.width =
      newSize.width + 'px';

    // Causes a ExpressionChangedAfterItHasBeenCheckedError
    // this.stateService.updateVisibleWindowDimensions(newSize);
  }

  ngAfterViewInit() {
    this.updateWorksurfaceDimensions();
  }

  ngOnInit() {
    this.selectedProject = new Project('New Test Proj');
    this.projectService.updateProject(this.selectedProject);
    // this.projectService.getProject();
    if (!this.selectedProject) {
      this.routerService.navigateTo(PageType.PROJECT_EXPLORER);
      return;
    }
    this.userApp = this.selectedProject.getUserApp();
    const appId = this.userApp.getId();

    // Currently for testing
    // We create a main widget, give it some nester (inner) widgets
    // and give them some interesting sizes and positions.

    this.selectedWidget = new UserWidget(this.selectedProject, 'test',
      { height: 600, width: 800 },
      appId);

    this.selectedWidget.updatePosition({ top: 100, left: 300 });
    const innerWidget1 = new LabelBaseWidget(
      this.selectedProject,
      'test inner1',
      { height: 100, width: 200 }, 'hello I am test', appId);
    this.selectedWidget.addInnerWidget(innerWidget1);
    innerWidget1.updatePosition({ top: 50, left: 100 });

    const innerWidget2 = new UserWidget(this.selectedProject, 'test inner2', { height: 200, width: 400 }, appId);
    this.selectedWidget.addInnerWidget(innerWidget2);
    innerWidget2.updatePosition({ top: 200, left: 200 });

    const innerWidget21 = new UserWidget(this.selectedProject, 'test inner21', { height: 400, width: 200 }, appId);
    innerWidget2.addInnerWidget(innerWidget21);
    innerWidget21.updatePosition({ top: 50, left: 100 });

    const innerWidget211 = new LinkBaseWidget(
      this.selectedProject, 'inner211',
      { height: 200, width: 150 },
      {text: '100100', target: undefined}, appId);

    innerWidget21.addInnerWidget(innerWidget211);

    this.userApp.addPage(this.selectedWidget);
    this.projectService.projectUpdated();
    this.projectService.updateSelectedWidget(this.selectedWidget);
  }
}
