import { Component, Input } from '@angular/core';

import { Widget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-panel-widget-display',
  templateUrl: './panel-widget-display.component.html',
})
export class PanelWidgetDisplayComponent {
  @Input() widget: Widget;
}
