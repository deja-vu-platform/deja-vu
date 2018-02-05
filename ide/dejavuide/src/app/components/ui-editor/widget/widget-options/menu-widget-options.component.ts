import { Component, Input, OnInit } from '@angular/core';

import { MenuBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-menu-widget',
  templateUrl: './menu-widget-options.component.html',
})
export class MenuWidgetOptionsComponent implements OnInit {
  @Input() widget: MenuBaseWidget;

  value;

  ngOnInit() {
    this.value = this.widget.getValue();
  }

  add() {
    this.value.push(this.widget.getNew(this.value.length));
  }

  applyChanges(apply: boolean) {
    if (apply) {
      this.widget.setValue(this.value);
    } else {
      this.value = this.widget.getValue();
    }
  }
}
