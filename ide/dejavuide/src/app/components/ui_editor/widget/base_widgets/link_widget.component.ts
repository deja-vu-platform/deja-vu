import { Component, Input, OnInit } from '@angular/core';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';

@Component({
  selector: 'dv-link-widget',
  templateUrl: './link_widget.component.html',
})
export class LinkWidgetComponent implements OnInit {
  @Input() widget: BaseWidget;

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
