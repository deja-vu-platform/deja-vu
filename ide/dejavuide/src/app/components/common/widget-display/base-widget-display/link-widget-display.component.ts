import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-link-widget-display',
  templateUrl: './link-widget-display.component.html',
})
export class LinkWidgetDisplayComponent {
  @Input() value;
}
