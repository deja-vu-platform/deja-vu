import { Component, Input, OnInit } from '@angular/core';

import { PanelBaseWidget } from '../../../core/models/widget/widget';

@Component({
  selector: 'dv-panel-widget',
  templateUrl: './panel-widget-options.component.html',
})
export class PanelWidgetOptionsComponent implements OnInit {
  @Input() widget: PanelBaseWidget;

  value;
  style;
  bootstrapPrefix = 'panel';
  bootstrapStyles = [
    {class: 'default', name: 'Default'},
    {class: 'primary', name: 'Primary'},
    {class: 'success', name: 'Success'},
    {class: 'info', name: 'Info'},
    {class: 'warning', name: 'Warning'},
    {class: 'danger', name: 'Danger'}];

  ngOnInit() {
    this.value = this.widget.getValue();
  }

  applyChanges(apply: boolean) {
    if (apply) {
      this.widget.setValue(this.value);
    } else {
      this.value = this.widget.getValue();
    }
  }

  setStyle(name) {
    this.style = this.bootstrapPrefix + '-' + name;
    this.widget.setBootstrapClass(this.style);
    console.log(this.style);
  }
}
