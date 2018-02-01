import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-user-widget-display',
  templateUrl: './user-widget-display.component.html',
})
export class UserWidgetDisplayComponent {
  @Input() value;
}
