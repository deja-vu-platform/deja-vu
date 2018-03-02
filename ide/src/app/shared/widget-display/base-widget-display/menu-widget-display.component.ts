import { Component, Input } from '@angular/core';

import { Widget } from '../../../core/models/widget/widget';

@Component({
  selector: 'dv-menu-widget-display',
  templateUrl: './menu-widget-display.component.html',
})
export class MenuWidgetDisplayComponent {
  @Input() widget: Widget;
}
