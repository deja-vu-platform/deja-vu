import { Component, Input } from '@angular/core';

import {
  ActionInstance,
  App,
  AppActionDefinition,
  Row
} from '../datatypes';
import { ScopeIO } from '../io';

const emptyRow = new Row();

@Component({
  selector: 'app-action-definition',
  templateUrl: './action-definition.component.html',
  styleUrls: ['./action-definition.component.scss']
})
export class ActionDefinitionComponent {
  @Input() app: App;
  actionInstance: ActionInstance;
  readonly scopeIO: ScopeIO = new ScopeIO();
  private readonly _rows: Row[] = [];

  constructor() { }

  @Input()
  set openAction(action: AppActionDefinition) {
    this.actionInstance = new ActionInstance(action, this.app);
    this.scopeIO.link(this.actionInstance);
  }

  get rows() {
    this._rows.length = 0;
    this._rows.push.apply(
      this._rows,
      (<AppActionDefinition>this.actionInstance.of).rows
    );
    this._rows.push(emptyRow);

    return this._rows;
  }

  onMenuClosed() {
    this.scopeIO.link(this.actionInstance);
  }

}
