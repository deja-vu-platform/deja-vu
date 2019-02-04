import { Component, Input } from '@angular/core';
import { AppActionDefinition } from '../datatypes';

@Component({
  selector: 'app-action-definition',
  templateUrl: './action-definition.component.html',
  styleUrls: ['./action-definition.component.scss']
})
export class ActionDefinitionComponent {
  @Input() readonly openAction: AppActionDefinition;
}
