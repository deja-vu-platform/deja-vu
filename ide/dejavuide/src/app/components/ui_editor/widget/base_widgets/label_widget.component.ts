import { Component, Input } from '@angular/core';

import { LabelBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-label-widget',
  templateUrl: './label_widget.component.html',
})
export class LabelWidgetComponent {
  @Input() widget: LabelBaseWidget;

  tooltipHidden = false;
  value = 'Type text here...';

  updateText(event) {
    this.value = event.target.value;
  }

  applyChanges() {
    this.widget.setValue(this.value);
  }
}
