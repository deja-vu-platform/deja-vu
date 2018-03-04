import { Component, Input } from '@angular/core';

import { Widget } from '../../../core/models/widget/widget';

@Component({
  selector: 'dv-label-widget-display',
  templateUrl: './label-widget-display.component.html',
})
export class LabelWidgetDisplayComponent {
  @Input() widget: Widget;
}
