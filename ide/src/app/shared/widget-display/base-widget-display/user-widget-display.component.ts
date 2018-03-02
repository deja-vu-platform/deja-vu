import { Component, Input } from '@angular/core';

import { Widget } from '../../../core/models/widget/widget';

@Component({
  selector: 'dv-user-widget-display',
  templateUrl: './user-widget-display.component.html',
})
export class UserWidgetDisplayComponent {
  @Input() widget: Widget;
}
