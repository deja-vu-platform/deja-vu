import { Component, Input } from '@angular/core';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';
import { Event } from '_debugger';

@Component({
  selector: 'dv-label-widget',
  templateUrl: './label_widget.component.html',
})
export class LabelWidgetComponent {
  @Input() widget: BaseWidget;

  tooltipHidden = false;
  value = 'Type text here...';

  updateText(event) {
    this.value = event.target.value;
  }

  applyChanges() {
    this.widget.setValue(this.value);
  }
}
