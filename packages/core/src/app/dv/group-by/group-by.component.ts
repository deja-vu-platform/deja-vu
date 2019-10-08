import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';

import { RunService } from '../run.service';

import * as _ from 'lodash';


/**
 * Outputs an array of objects grouped by the given key
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

  /** The name of the field to group by */
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
