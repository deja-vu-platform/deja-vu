import { Component, Input } from '@angular/core';

import { Widget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-image-widget-display',
  templateUrl: './image-widget-display.component.html',
})
export class ImageWidgetDisplayComponent {
  @Input() widget: Widget;
}
