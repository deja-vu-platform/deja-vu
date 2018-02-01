import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { LabelBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-label-widget',
  templateUrl: './label-widget.component.html',
})
export class LabelWidgetComponent implements OnInit {
  @Input() widget: LabelBaseWidget;

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
