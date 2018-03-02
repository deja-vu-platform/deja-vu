
import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Widget } from '../../core/models/widget/widget';
import { ProjectService } from '../../core/services/project.service';
import { UserCliche } from '../../core/models/cliche/cliche';

@Component({
  selector: 'dv-map-widget',
  templateUrl: './map-widget.component.html',
  styleUrls: ['./map-widget.component.css']
})
export class MapWidgetComponent implements OnInit {
  @Input() widget: Widget;
  innerWidgets: Observable<Widget[]>;
  el: HTMLElement;
  private subscriptions = [];

  userApp: Observable<UserCliche>;

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
