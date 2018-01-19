import { Component, Input, OnInit } from '@angular/core';

import { ImageBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-link-widget',
  templateUrl: './link_widget.component.html',
})
export class LinkWidgetComponent implements OnInit {
  @Input() widget: ImageBaseWidget;

  value;

  ngOnInit() {
    this.value = this.widget.getValue();
  }

  updateLinkText(event) {
    this.value.text = event.target.value;
  }

  updateLinkTarget(event) {
    this.value.target = event.target.value;
  }

  applyChanges() {
    this.widget.setValue(this.value);
  }
}
