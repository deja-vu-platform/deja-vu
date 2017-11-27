import { Component, Input } from '@angular/core';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';

@Component({
  selector: 'dv-label-widget',
  templateUrl: './label_widget.component.html',
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
