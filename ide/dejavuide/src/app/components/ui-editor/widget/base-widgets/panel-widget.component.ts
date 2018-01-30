import { Component, Input, OnInit } from '@angular/core';

import { PanelBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-panel-widget',
  templateUrl: './panel-widget.component.html',
})
export class PanelWidgetComponent implements OnInit {
  @Input() widget: PanelBaseWidget;

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
