import { Component, Input } from '@angular/core';
import { Row } from '../datatypes';

@Component({
  selector: 'app-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss']
})
export class RowComponent {
  @Input() row = new Row(); // we always show an extra row
  @Input() rowNum = -1;
}
