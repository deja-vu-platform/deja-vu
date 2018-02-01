import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { LabelBaseWidget } from '../../../../models/widget/widget';
import * as $ from 'jquery';

@Component({
  selector: 'dv-label-widget',
  templateUrl: './label-widget.component.html',
})
export class LabelWidgetComponent implements OnInit {
  // @ViewChild('edit', {read: ElementRef}) private editElt: ElementRef;

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
