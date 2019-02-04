import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionInstance, App, AppActionDefinition, Row } from '../datatypes';
import { linkChildren, ScopeIO } from '../io';

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
  private subscriptions: Subscription[] = [];
  private readonly _rows: Row[] = [];

  @Input()
  set openAction(action: AppActionDefinition) {
    this.actionInstance = new ActionInstance(action, this.app);
    this.resetIO();
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

  onMenuClosed(_action: ActionInstance) {
    this.resetIO();
  }

  private resetIO() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = linkChildren(
      this.actionInstance,
      this.scopeIO
    );
  }
}
