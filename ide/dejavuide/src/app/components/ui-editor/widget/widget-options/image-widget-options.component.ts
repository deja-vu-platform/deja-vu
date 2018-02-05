import { Component, Input, OnInit } from '@angular/core';

import { ImageBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-image-widget',
  templateUrl: './image-widget-options.component.html',
  styleUrls: ['./image-widget-options.component.css']
})
export class ImageWidgetOptionsComponent implements OnInit {
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

  applyChanges(apply: boolean) {
    if (apply) {
      this.widget.setValue(this.value);
    } else {
      this.value = this.widget.getValue();
    }
  }
}
