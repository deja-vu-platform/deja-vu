import { Component, Input, OnInit } from '@angular/core';

// import { TabBaseWidget } from '../../../../models/widget/widget';

// TODO
declare type TabBaseWidget = any;

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

  applyChanges(apply: boolean) {
    if (apply) {
      this.widget.setValue(this.value);
    } else {
      this.value = this.widget.getValue();
    }
  }
}
