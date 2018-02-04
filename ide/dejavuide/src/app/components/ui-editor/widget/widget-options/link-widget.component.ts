import { Component, Input, OnInit } from '@angular/core';

import { LinkBaseWidget } from '../../../../models/widget/widget';

@Component({
  selector: 'dv-link-widget',
  templateUrl: './link-widget.component.html',
})
export class LinkWidgetComponent implements OnInit {
  @Input() widget: LinkBaseWidget;

  value;
  style;
  bootstrapPrefix = 'btn';
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
