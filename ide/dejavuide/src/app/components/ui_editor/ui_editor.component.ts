import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import { BaseWidget, Widget, UserWidget } from '../../models/widget/widget';
import { Cliche, UserCliche } from '../../models/cliche/cliche';
import { Project } from '../../models/project/project';
import { Dimensions } from '../../services/state.service';
import { RouterService, PageType } from '../../services/router.service';
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

  private selectedProject: Project;
  userApp: UserCliche;
  private selectedWidget: UserWidget;
  private allCliches = new Map<string, Cliche>();

  constructor (
    private projectService: ProjectService,
    private routerService: RouterService) {
  }

  private updateWorksurfaceDimensions() {
    this.windowSize = {
      height: window.innerHeight,
      width: window.innerHeight
    };
    this.worksurfaceElt.nativeElement.style.height =
      (this.windowSize.height - 60) + 'px';
    this.worksurfaceElt.nativeElement.style.width =
      (this.windowSize.width - 250) + 'px';
  }

  ngAfterViewInit() {
    this.updateWorksurfaceDimensions();
  }

  ngOnInit() {
    this.selectedProject = new Project('New Test Proj');
    // this.projectService.getProject();
    if (!this.selectedProject) {
      this.routerService.navigateTo(PageType.PROJECT_EXPLORER);
      return;
    }
    this.userApp = this.selectedProject.getUserApp();
    if (!this.userApp) {
      this.userApp = this.selectedProject.newUserApp();
    }
    const appId = this.userApp.getId();

    this.selectedWidget = new UserWidget('test',
      { height: 600, width: 800 },
      appId);

    // Currently for testing
    // We create a main widget, give it some nester (inner) widgets
    // and give them some interesting sizes and positions.
    this.allCliches.set(this.userApp.getId(), this.userApp);
    this.userApp.addPage(this.selectedWidget);

    // Note for later: .updateWidgetMap for widget needs to happen
    // before doing .addWidgetToAllWidgets()
    this.selectedWidget.updateClicheMap(this.allCliches);
    this.selectedWidget.updatePosition({ top: 100, left: 300 });
    Widget.addWidgetToCliche(this.allCliches, this.selectedWidget);
    const innerWidget1 = new BaseWidget('test inner1', { height: 100, width: 200 }, 'img', '/', appId);
    innerWidget1.updateClicheMap(this.allCliches);
    innerWidget1.addWidgetToCliche();
    this.selectedWidget.addInnerWidget(innerWidget1.getId());
    innerWidget1.updatePosition({ top: 50, left: 100 });

    const innerWidget2 = new UserWidget('test inner2', { height: 200, width: 400 }, appId);
    innerWidget2.updateClicheMap(this.allCliches);
    innerWidget2.addWidgetToCliche();
    this.selectedWidget.addInnerWidget(innerWidget2.getId());
    innerWidget2.updatePosition({ top: 200, left: 200 });

    const innerWidget21 = new UserWidget('test inner21', { height: 100, width: 100 }, appId);
    innerWidget21.updateClicheMap(this.allCliches);
    innerWidget21.addWidgetToCliche();
    innerWidget2.addInnerWidget(innerWidget21.getId());
    innerWidget21.updatePosition({ top: 50, left: 100 });

    this.projectService.updateClicheMap(this.allCliches);
    this.projectService.updateSelectedWidget(this.selectedWidget);
  }
}
