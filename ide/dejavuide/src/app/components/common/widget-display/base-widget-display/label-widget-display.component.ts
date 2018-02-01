import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { LabelBaseWidget } from '../../../../models/widget/widget';
import * as $ from 'jquery';

@Component({
  selector: 'dv-label-widget-display',
  templateUrl: './label-widget-display.component.html',
})
export class LabelWidgetDisplayComponent implements AfterViewInit {
  @ViewChild('edit', {read: ElementRef}) private editElt: ElementRef;

  // TODO move this to options
  @Input() widget: LabelBaseWidget;
  @Input() value;

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
