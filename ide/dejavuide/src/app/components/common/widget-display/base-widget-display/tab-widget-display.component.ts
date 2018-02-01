import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-tab-widget',
  templateUrl: './tab-widget-display.component.html',
})
export class TabWidgetDisplayComponent {
  @Input() value;
}
