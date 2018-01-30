import { Component, Input, OnInit } from '@angular/core';

// import { MenuBaseWidget } from '../../../../models/widget/widget';

// TODO
declare type MenuBaseWidget = any;

@Component({
  selector: 'dv-menu-widget',
  templateUrl: './menu-widget.component.html',
})
export class MenuWidgetComponent implements OnInit {
  @Input() widget: MenuBaseWidget;

  value;

  ngOnInit() {
    this.value = this.widget.getValue();
  }

  applyChanges(apply: boolean) {
    if (apply) {
      this.widget.setValue(this.value);
    } else {
      this.value = this.widget.getValue();
    }
  }
}
