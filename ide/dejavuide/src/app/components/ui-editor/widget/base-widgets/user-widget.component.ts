import { Component, Input } from '@angular/core';

import { UserWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-user-widget',
  templateUrl: './user-widget.component.html',
})
export class UserWidgetComponent {
  @Input() widget: UserWidget;
}
