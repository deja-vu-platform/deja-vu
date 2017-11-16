import { Component, Input } from '@angular/core';

import { Widget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-list-section',
  templateUrl: './list_section.component.html',
  styleUrls: ['./list_section.component.css']
})
export class ListSectionComponent {
  @Input() widgets: Widget[];
}
