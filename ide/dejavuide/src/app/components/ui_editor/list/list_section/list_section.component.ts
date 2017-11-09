import { Component, Input } from '@angular/core';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget, UserWidget, WidgetType } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-list-section',
  templateUrl: './list_section.component.html',
  styleUrls: ['./list_section.component.css']
})
export class ListSectionComponent {
  @Input() widgets: Widget[];
}
