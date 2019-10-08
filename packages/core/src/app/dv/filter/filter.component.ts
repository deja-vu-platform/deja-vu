import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';

import { RunService } from '../run.service';

import * as _ from 'lodash';


/**
 * Filter an array
 */
@Component({
  selector: 'dv-filter',
  templateUrl: './filter.component.html'
})
export class FilterComponent implements OnInit, OnChanges {
  /** A list of entities to filter */
  @Input() entitiesToFilter: any[];

  /**
   * The function invoked per iteration. Follows the definition of lodash:
   * https://lodash.com/docs/4.17.15#filter
   */
  @Input() filter: any;

  /**
   * Input an object with { key: value[] } pairs to retain those entities in
   * `entitiesToFilter` that have a key in the corresponding lists. Multiple
   * keys connect with `and` logic.
   * Example:
   *    {
   *      id: [2, 3, 5, 7, 11],
   *      name: [Alice, Bob, Mike]
   *    }
   */
  @Input() filterMultipleValues: any[];

  /** The output list */
  @Output() filteredEntities = new EventEmitter<any[]>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    let entitiesBeingFiltered = this.entitiesToFilter;
    if (this.filter) {
      entitiesBeingFiltered = _.filter(entitiesBeingFiltered, this.filter);
    }
    if (this.filterMultipleValues) {
      entitiesBeingFiltered = _.filter(entitiesBeingFiltered,
        (entity) => {
          for (const key of Object.keys(this.filterMultipleValues)) {
            if (!entity[key] ||
              !_.includes(this.filterMultipleValues[key], entity[key])) {
              return false;
            }
          }

          return true;
        });
    }
    this.filteredEntities.emit(entitiesBeingFiltered);
  }
}
