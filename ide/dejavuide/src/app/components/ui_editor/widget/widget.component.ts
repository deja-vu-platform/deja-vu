import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';

import { Widget, WidgetType } from '../../../models/widget/widget';

import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;

@Component({
  selector: 'dv-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css'],
})
export class WidgetComponent implements AfterViewInit {
  @Input() allWidgets:  Map<string, Map<string, Widget>>;
  @Input() widget: Widget;
  @Input() isSelected = false;
  @Input() isMovable = false;

  @Output() onChange = new EventEmitter<boolean>();

  widgetType = WidgetType;
  Widget = Widget;

  private el: HTMLElement;

  constructor(el: ElementRef) {
      this.el = el.nativeElement;
  }

  ngAfterViewInit() {
    this.el.style.top = this.widget.getPosition().top + 'px';
    this.el.style.left = this.widget.getPosition().left + 'px';
    this.el.style.position = 'absolute';

    if (this.isSelected || this.isMovable) {
      const _this = this;
      $(this.el).draggable({
        containment: '.work-surface',
        stop: function(e, ui){
          _this.widget.updatePosition(ui.position);
          _this.onChange.emit(true);
        },
      });
    }
  }

  handleChange() {
    this.onChange.emit(true);
  }
}
