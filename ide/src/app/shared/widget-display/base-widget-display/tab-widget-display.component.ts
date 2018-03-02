import { Component, Input } from '@angular/core';

import { Widget } from '../../../core/models/widget/widget';

@Component({
  selector: 'dv-tab-widget-display',
  templateUrl: './tab-widget-display.component.html',
})
export class TabWidgetDisplayComponent {
  @Input() widget: Widget;
}
