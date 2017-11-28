import { Component, Input, OnInit } from '@angular/core';

import { LinkBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-link-widget',
  templateUrl: './link_widget.component.html',
})
export class LinkWidgetComponent implements OnInit {
  @Input() widget: LinkBaseWidget;

  tooltipHidden = false;
  // TODO defaults should be made in the widget itself
  value = {
    text: 'Link',
    target: '#'
  };

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
