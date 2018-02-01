import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-menu-widget-display',
  templateUrl: './menu-widget-display.component.html',
})
export class MenuWidgetDisplayComponent {
  @Input() value;
}
