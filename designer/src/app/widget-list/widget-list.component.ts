import { Component, Input } from '@angular/core';
import { Cliche } from '../datatypes';

@Component({
  selector: 'app-widget-list',
  templateUrl: './widget-list.component.html',
  styleUrls: ['./widget-list.component.scss'],
})
export class WidgetListComponent {
  @Input() cliche: Cliche = { name: '', components: {} };

  get componentNames() {
    return Object.keys(this.cliche.components);
  }
}
