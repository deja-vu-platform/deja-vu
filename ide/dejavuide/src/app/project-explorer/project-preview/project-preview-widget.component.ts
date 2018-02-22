
import { Component, Input, OnInit} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { UserCliche } from '../../../models/cliche/cliche';
import { Widget } from '../../../models/widget/widget';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'dv-project-preview-widget',
  templateUrl: './project-preview-widget.component.html',
  styleUrls: ['./project-preview-widget.component.css']
})
export class ProjectPreviewWidgetComponent implements OnInit {
  @Input() widget: Widget;
  @Input() userApp: UserCliche;
  innerWidgets: Widget[];

  ngOnInit() {
    this.innerWidgets = this.userApp.getWidgets(this.widget.getInnerWidgetIds());
  }
}
