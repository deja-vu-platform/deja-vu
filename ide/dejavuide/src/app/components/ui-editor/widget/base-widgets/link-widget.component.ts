import { Component, Input, OnInit } from '@angular/core';

import { LinkBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-link-widget',
  templateUrl: './link-widget.component.html',
})
export class LinkWidgetComponent implements OnInit {
  @Input() widget: LinkBaseWidget;

  value;

  ngOnInit() {
    this.value = this.widget.getValue();
  }

  applyChanges() {
    this.widget.setValue(this.value);
  }
}
