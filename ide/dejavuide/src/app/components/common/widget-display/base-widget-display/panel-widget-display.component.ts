import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-panel-widget-display',
  templateUrl: './panel-widget-display.component.html',
})
export class PanelWidgetDisplayComponent {
  @Input() value;
}
