import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  App,
  AppComponentDefinition,
  ConceptInstance
} from '../datatypes';


@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent {
  @Input() readonly app: App;
  @Input() readonly openComponent: AppComponentDefinition;
  @Output() readonly conceptAdded = new EventEmitter<ConceptInstance>();
  @Output() readonly conceptRemoved = new EventEmitter<string>();
}
