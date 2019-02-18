import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import * as _ from 'lodash';

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
export class ActionDefinitionComponent implements AfterViewInit {
  @Input() app: App;
  @ViewChildren('instanceContainer')
    private instanceContainers: QueryList<ElementRef>;
  actionInstance: ActionInstance;
  readonly scopeIO: ScopeIO = new ScopeIO();
  private readonly _rows: Row[] = [];

  ngAfterViewInit() {
    this.instanceContainers.changes.subscribe(() => {
      setTimeout(() => {
        this.calcShowHint();
      });
    });
  }

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
    // need to wait for values to propogate
    setTimeout(() => this.calcShowHint());
  }

  private calcShowHint() {
    let rowActions = 0;
    this.rows.forEach((row) => {
      row.actions.forEach((action, actionNum) => {
        const index = rowActions + actionNum;
        const actionContainer = this.instanceContainers.toArray()[index];
        const firstChild = actionContainer
          && actionContainer.nativeElement.firstElementChild.firstElementChild;
        const showHint = (
          firstChild
          && (
            firstChild.offsetHeight === 0
            || firstChild.offsetWidth === 0
          )
        );
        action['showHint'] = showHint;
      });
      rowActions += row.actions.length;
    });
  }

}
