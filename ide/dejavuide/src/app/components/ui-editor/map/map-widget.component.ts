
import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Widget } from '../../../models/widget/widget';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'dv-map-widget',
  templateUrl: './map-widget.component.html',
  styleUrls: ['./map-widget.component.css']
})
export class MapWidgetComponent implements OnInit {
  @Input() widget: Widget;
  @Input() scale = 1;
  innerWidgets: Observable<Widget[]>;
  el: HTMLElement;
  @Input() activated: boolean;
  private subscriptions = [];

  userApp;

  constructor(
    private projectService: ProjectService,
  ) {
    this.userApp = this.projectService.selectedProject.map(
      project => project.getUserApp());
  }

  ngOnInit() {
    this.innerWidgets = this.widget.innerWidgetIds.map(
      innerWidgetIds => this.projectService.getWidgets(innerWidgetIds)
    );
  }
}
