import { Component, Input, OnInit } from '@angular/core';

import { TabBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-tab-widget',
  templateUrl: './tab-widget.component.html',
})
export class TabWidgetComponent implements OnInit {
  @Input() widget: TabBaseWidget;

  value;
  count = -1;

  ngOnInit() {
    this.value = this.widget.getValue();
  }

  // TODO this might need to go in widget.ts
  add() {
    this.value.push({
      text: 'Tab 0',
      target: 'tab-id-' + this.count
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
