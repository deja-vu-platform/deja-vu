import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-widget-options',
  templateUrl: './options.component.html',
})
export class WidgetOptionsComponent {
  @Input() editDisabled = false;
}
