import {
  Component, OnInit, Input, Output, EventEmitter, ElementRef, OnChanges
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
   * follows the definition of lodash:
   * https://lodash.com/docs/4.17.15#filter
   */
  @Input() filter: any;

  /** The output list */
  @Output() filteredEntities = new EventEmitter<any[]>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    this.filteredEntities.emit(_.filter(this.entitiesToFilter, this.filter));
  }
}
