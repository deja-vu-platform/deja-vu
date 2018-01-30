import { Component, Input, OnInit } from '@angular/core';

import { MenuBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-menu-widget',
  templateUrl: './menu-widget.component.html',
})
export class MenuWidgetComponent implements OnInit {
  @Input() widget: MenuBaseWidget;

  value;
  count = -1;

  ngOnInit() {
    this.value = this.widget.getValue();
  }

  // TODO this might need to go in widget.ts
  add() {
    this.value.push({
      text: 'Menu 0',
      target: '???' + this.count
    });
    this.count = this.count + 1;
  }

  applyChanges(apply: boolean) {
    if (apply) {
      this.widget.setValue(this.value);
    } else {
      this.value = this.widget.getValue();
    }
  }
}
