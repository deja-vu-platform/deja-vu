import { Component, Input } from '@angular/core';

import { Widget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-link-widget-display',
  templateUrl: './link-widget-display.component.html',
})
export class LinkWidgetDisplayComponent {
  @Input() widget: Widget;
}
