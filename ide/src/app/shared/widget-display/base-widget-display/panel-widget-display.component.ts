import { Component, Input, OnInit } from '@angular/core';

import { Widget } from '../../../core/models/widget/widget';

@Component({
  selector: 'dv-panel-widget-display',
  templateUrl: './panel-widget-display.component.html',
})
export class PanelWidgetDisplayComponent implements OnInit {
  @Input() widget: Widget;

  class;
  ngOnInit() {
    this.class = this.widget.styles.map(() => this.widget.getBootstrapClass());
  }
}
