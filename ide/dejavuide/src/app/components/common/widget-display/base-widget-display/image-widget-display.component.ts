import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-image-widget-display',
  templateUrl: './image-widget-display.component.html',
})
export class ImageWidgetDisplayComponent {
  @Input() value;
}
