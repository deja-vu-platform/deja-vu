import {
  Component, OnInit, Input, Output, EventEmitter, ElementRef, OnChanges
} from '@angular/core';

import { RunService } from '../run.service';
import * as _ from 'lodash';

/**
 * Outputs an array of objects grouped by having the
 * same field specified by a key
 * Output structure:
 * [
 *   { groupedById: 'key1', items: [list of items with groupById=key1] },
 *   { groupedById: 'key2', items: [list of items with groupById=key2] },
 *   ...
 * ]
 */
@Component({
  selector: 'dv-group-by',
  templateUrl: './group-by.component.html'
})
export class GroupByComponent implements OnInit, OnChanges {
  /** A list of entities to be grouped */
  @Input() items: any[];

  /** The name of the key to group with */
  @Input() key: string;

  /** The output list */
  @Output() groupedItems = new EventEmitter<any[]>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    const groupedItems = _
      .chain(this.items)
      .groupBy(this.key)
      .map((val, key) => ({groupById: key, items: val}))
      .value();
    this.groupedItems.emit(groupedItems);
  }
}
