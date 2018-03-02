import { Component, Input, OnInit } from '@angular/core';

import { Widget } from '../../../core/models/widget/widget';

@Component({
  selector: 'dv-link-widget-display',
  templateUrl: './link-widget-display.component.html',
})
export class LinkWidgetDisplayComponent implements OnInit {
  @Input() widget: Widget;
  // = 'btn-link'
  class;
  ngOnInit() {
    this.class = this.widget.styles.map(() => this.widget.getBootstrapClass());
  }
}
