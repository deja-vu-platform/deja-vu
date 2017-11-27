import { Component, Input } from '@angular/core';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';

@Component({
  selector: 'dv-lable-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css'],
})
export class LabelWidgetComponent {
  @Input() widget: BaseWidget;

  tooltipHidden = true;
  value = 'Type text here...';

  updateText(text) {
    this.value = text;
  }

  applyChanges() {
    this.widget.setValue(this.value);
  }
}
