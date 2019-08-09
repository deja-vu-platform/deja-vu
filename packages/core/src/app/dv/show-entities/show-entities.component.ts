import {
  Component, ElementRef, Input, Type
} from '@angular/core';

import { ComponentValue } from '../include/include.component';
import { ShowEntityComponent } from '../show-entity/show-entity.component';
import { RunService } from '../run.service';


@Component({
  selector: 'dv-show-entities',
  templateUrl: './show-entities.component.html'
})
export class ShowEntitiesComponent {
  /**
   * A list of entities to show
   */
  @Input() entities: any[] = [];

  /**
   * The user-defined component that overwrites
   * the default showEntity Component
   */
  @Input() showEntity: ComponentValue = {
    type: <Type<Component>> ShowEntityComponent
  };

  /**
   * Text to display when empty list or undefined entities are passed in
   */
  @Input() noEntitiesToShowText = 'No entities';
  showEntities;

  constructor(private elem: ElementRef, private rs: RunService) {
    this.showEntities = this;
  }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }
}
