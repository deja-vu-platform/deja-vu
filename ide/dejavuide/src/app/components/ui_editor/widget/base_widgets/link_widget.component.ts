import { Component, Input } from '@angular/core';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';

@Component({
  selector: 'dv-link-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css'],
})
export class LinkWidgetComponent {
  @Input() widget: BaseWidget;

  updateLinkText(text) {

  }

  updateLinkTarget(text) {

  }
}
