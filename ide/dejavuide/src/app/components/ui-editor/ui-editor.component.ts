import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';

import { LabelBaseWidget, LinkBaseWidget, Widget, UserWidget } from '../../models/widget/widget';
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
  templateUrl: './ui-editor.component.html',
  styleUrls: ['./ui-editor.component.css']
})
export class UiEditorComponent implements OnInit, AfterViewInit {
  @ViewChild('worksurface', {read: ElementRef}) private worksurfaceElt: ElementRef;
  selectedProject: Project;
  private userApp: UserCliche;
  selectedWidget: Widget;

  constructor (
    private projectService: ProjectService,
    private stateService: StateService,
    private routerService: RouterService,
    private ref: ChangeDetectorRef) {
  }

  ngAfterViewInit() {
    // this.handleWindowResize();
    // this.projectService.selectedWidget.subscribe((newSelectedWidget) => {
    //   if (this.selectedWidget !== newSelectedWidget) {
    //     this.refreshWorkSurface(newSelectedWidget);
    //   }
    //   // console.log('new selected widget');
    // });
  }

  ngOnInit() {
    // this.selectedProject = new Project('New Test Proj');
    // this.projectService.updateProject(this.selectedProject);
    this.selectedProject = this.projectService.getProject();
    if (!this.selectedProject) {
      this.routerService.navigateTo(PageType.PROJECT_EXPLORER);
      return;
    }
    this.userApp = this.selectedProject.getUserApp();
    const appId = this.userApp.getId();

    if (this.userApp.numPages() === 0) {
      // Currently for testing
      // We create a main widget, give it some nester (inner) widgets
      // and give them some interesting sizes and positions.
      const testWidget = new UserWidget(
        {name: 'test',
        dimensions: { height: 600, width: 800 },
        position: { top: 100, left: 300 },
        clicheId: appId});

      this.userApp.addWidget(testWidget);
      this.userApp.setAsPage(testWidget);

      const innerWidget1 = new LabelBaseWidget(
        {name: 'test inner1',
        dimensions: { height: 100, width: 200 },
        position: { top: 50, left: 100 },
        value: 'hello I am test',
        clicheId: appId});
      this.userApp.addWidget(innerWidget1);
      testWidget.setAsInnerWidget(this.userApp, innerWidget1);

      // const innerWidget7 = new LinkBaseWidget(
      //   this.selectedProject,
      //   'test inner7',
      //   { height: 100, width: 200 }, null, appId);
      // testWidget.addInnerWidget(innerWidget7);
      // innerWidget7.updatePosition({ top: 450, left: 100 });

      const innerWidget2 = new UserWidget(
        {name: 'test inner2',
        dimensions: { height: 200, width: 400 },
        position: { top: 200, left: 200 },
        clicheId: appId});
      this.userApp.addWidget(innerWidget2);
      testWidget.setAsInnerWidget(this.userApp, innerWidget2);

      const innerWidget21 = new UserWidget(
        {name: 'test inner21',
        dimensions: { height: 400, width: 200 },
        position: { top: 50, left: 100 },
        clicheId: appId});
      this.userApp.addWidget(innerWidget21);
      innerWidget2.setAsInnerWidget(this.userApp, innerWidget21);

      const innerWidget211 = new LinkBaseWidget(
        {name: 'inner211',
        dimensions: { height: 200, width: 150 },
        value: {text: '100100', target: undefined},
        clicheId: appId});
      this.userApp.addWidget(innerWidget211);
      innerWidget21.setAsInnerWidget(this.userApp, innerWidget211);

      this.selectedWidget = testWidget;
    } else {
      const pageId = this.userApp.getPageIds()[0];
      this.selectedWidget = this.userApp.getWidget(pageId);
    }

    this.projectService.updateSelectedWidget(this.selectedWidget);
  }

  // refreshWorkSurface(widget: Widget) {
  //   this.selectedWidget = null;
  //   this.ref.detectChanges();
  //   this.selectedWidget = widget;
  //   this.ref.detectChanges();

  //   this.handleWindowResize();
  // }
}
