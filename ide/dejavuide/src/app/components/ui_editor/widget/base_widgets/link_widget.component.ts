import { Component, Input } from '@angular/core';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';

@Component({
  selector: 'dv-link-widget',
  templateUrl: './link_widget.component.html',
})
export class LinkWidgetComponent {
  @Input() widget: BaseWidget;

  tooltipHidden = true;
  value = {
    text: 'Link',
    target: undefined
  };

  updateLinkText(text) {
    this.value.text = text;
    this.widget.setValue(this.value);
  }

  updateLinkTarget(target) {
    this.value.target = target;
  }

  applyChanges() {
    this.widget.setValue(this.value);
  }
}
