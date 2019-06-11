import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  App,
  AppActionDefinition,
  ClicheInstance
} from '../datatypes';


@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent {
  @Input() readonly app: App;
  @Input() readonly openAction: AppActionDefinition;
  @Output() readonly clicheAdded = new EventEmitter<ClicheInstance>();
  @Output() readonly clicheRemoved = new EventEmitter<string>();
}
