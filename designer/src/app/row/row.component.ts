import { Component, Input } from '@angular/core';
import { ActionInstance, Row } from '../datatypes';

@Component({
  selector: 'app-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss']
})
export class RowComponent {
  @Input() row = new Row(); // we always show an extra row
  @Input() rowNum = -1;

  onMenuClosed(action: ActionInstance) {
    action.of.inputs.forEach((input) => {
      action.io[input].next(action.inputSettings[input]);
    });
  }
}
