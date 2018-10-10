import { Component, Input } from '@angular/core';
import { Row } from '../datatypes';

@Component({
  selector: 'app-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss'],
})
export class RowComponent {
  @Input() row: (Row & { index: number });

  get widgets() {
    return this.row.widgets.map((component, i) => ({ component, i }));
  }
}
