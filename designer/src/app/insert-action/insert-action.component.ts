import { Component, Input } from '@angular/core';

import {
  ActionDefinition,
  App,
  AppActionDefinition
} from '../datatypes';


@Component({
  selector: 'app-insert-action',
  templateUrl: './insert-action.component.html',
  styleUrls: ['./insert-action.component.scss']
})
export class InsertActionComponent {
  @Input() readonly app: App;
  @Input() readonly openAction: AppActionDefinition;

  disable(action: ActionDefinition) {
    return (
      action['contains']
      && (
        (<AppActionDefinition>action).contains(this.openAction, true)
        || action === this.openAction
      )
    );
  }
}
