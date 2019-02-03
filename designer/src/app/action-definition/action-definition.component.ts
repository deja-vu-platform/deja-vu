import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionInstance, AppActionDefinition, Row } from '../datatypes';
import { linkChildren, ScopeIO } from '../io';

const emptyRow = new Row();

@Component({
  selector: 'app-action-definition',
  templateUrl: './action-definition.component.html',
  styleUrls: ['./action-definition.component.scss']
})
export class ActionDefinitionComponent implements AfterViewInit, OnDestroy {
  @Input() readonly openAction: AppActionDefinition;
  readonly scopeIO: ScopeIO = new ScopeIO();
  private subscriptions: Subscription[] = [];
  private readonly _rows: Row[] = [];

  get rows() {
    this._rows.length = 0;
    this._rows.push.apply(
      this._rows,
      this.openAction.rows
    );
    this._rows.push(emptyRow);

    return this._rows;
  }

  ngAfterViewInit() {
    if (this.openAction) {
      this.subscriptions = linkChildren(this.openAction, this.scopeIO);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  onMenuClosed(_action: ActionInstance) {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = linkChildren(this.openAction, this.scopeIO);
  }
}
