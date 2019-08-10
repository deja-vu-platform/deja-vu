import { Component, Input } from '@angular/core';

import {
  ComponentDefinition,
  App,
  AppComponentDefinition
} from '../datatypes';


@Component({
  selector: 'app-insert-component',
  templateUrl: './insert-component.component.html',
  styleUrls: ['./insert-component.component.scss']
})
export class InsertComponentComponent {
  @Input() readonly app: App;
  @Input() readonly openComponent: AppComponentDefinition;

  disable(component: ComponentDefinition) {
    return (
      component['contains']
      && (
        (<AppComponentDefinition>component).contains(this.openComponent, true)
        || component === this.openComponent
      )
    );
  }
}
