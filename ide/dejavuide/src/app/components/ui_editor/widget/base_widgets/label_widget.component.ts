import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import { LabelBaseWidget } from '../../../../models/widget/widget';
import * as $ from 'jquery';

@Component({
  selector: 'dv-label-widget',
  templateUrl: './label_widget.component.html',
})
export class LabelWidgetComponent implements AfterViewInit {
  @ViewChild('edit', {read: ElementRef}) private editElt: ElementRef;

  @Input() widget: LabelBaseWidget;

  tooltipHidden = false;
  value = 'Type text here...';

  updateText(event) {
    this.value = event.target.innerText;
    this.widget.setValue(this.value);
  }

  // applyChanges() {
  //   this.widget.setValue(this.value);
  // }

  ngAfterViewInit() {
    const elt = this.editElt.nativeElement;
    $(elt).on('mousedown', (event) => {
      event.stopPropagation();
      $(elt).focus();
    });

    $(elt).blur(() => {
      console.log(this.value);
    });
  }
}
