import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ElementRef } from '@angular/core';

import { Widget, WidgetType } from '../../../models/widget/widget';

@Component({
  selector: 'dv-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css'],
})
export class WidgetComponent implements OnInit, AfterViewInit {
  @Input() allWidgets:  Map<string, Map<string, Widget>>;
  @Input() widget: Widget;

  widgetType = WidgetType;
  Widget = Widget;

  private el: HTMLElement;

  constructor(el: ElementRef) {
      this.el = el.nativeElement;
  }

  ngOnInit() {
    console.log(this.widget.getDimensions().height);
  }
  ngAfterViewInit() {
    this.el.style.top = this.widget.getPosition().top + 'px';
    this.el.style.left = this.widget.getPosition().left + 'px';
    this.el.style.position = 'absolute';
  }
}
