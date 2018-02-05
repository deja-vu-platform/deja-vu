import { Component, Input } from '@angular/core';

import { UserWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-user-widget',
  templateUrl: './user-widget-options.component.html',
})
export class UserWidgetOptionsComponent {
  @Input() widget: UserWidget;
}
