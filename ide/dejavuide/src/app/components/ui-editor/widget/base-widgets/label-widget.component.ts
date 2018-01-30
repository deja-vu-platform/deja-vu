import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { LabelBaseWidget } from '../../../../models/widget/widget';
import * as $ from 'jquery';

@Component({
  selector: 'dv-label-widget',
  templateUrl: './label-idget.component.html',
})
export class LabelWidgetComponent implements AfterViewInit {
  @ViewChild('edit', {read: ElementRef}) private editElt: ElementRef;

  @Input() widget: LabelBaseWidget;

  updateText(event) {
    this.widget.setValue(event.target.innerText);
  }

  ngAfterViewInit() {
    const elt = this.editElt.nativeElement;
    $(elt).on('mousedown', (event) => {
      event.stopPropagation();
      $(elt).focus();
    });
  }
}
