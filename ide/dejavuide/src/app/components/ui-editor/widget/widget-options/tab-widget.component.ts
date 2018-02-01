import { Component, Input, OnInit } from '@angular/core';

import { TabBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-tab-widget',
  templateUrl: './tab-widget.component.html',
})
export class TabWidgetComponent implements OnInit {
  @Input() widget: TabBaseWidget;

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
