import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';

import { RunService } from '../run.service';

import * as _ from 'lodash';


/**
 * Outputs an array of values not included in the other given arrays. By
 * default it compares the elements using lodash's SameValueZero, but if a `key`
 * is given it will use the values of `key` for comparison.
 *
 * Modeled after lodash's `difference` and `differenceBy`.
 */
@Component({
  selector: 'dv-difference',
  templateUrl: './difference.component.html'
})
export class DifferenceComponent implements OnInit, OnChanges {
  /** The array to inspect. If it is `null` it outputs an empty list */
  @Input() array: any[];

  /**
   * An array of arrays containing the values to exclude.
   * If `null` it outputs `array`
   */
  @Input() values: any[][];

  /** Use the vlues of the field of name `key` to compare */
  @Input() key: string;

  /** The output list */
  @Output() difference = new EventEmitter<any[]>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    if (!this.key) {
      this.difference.emit(_.difference(this.array, ...this.values));
    } else {
      this.difference.emit(
        _.differenceBy(this.array, ...this.values, this.key));
    }
  }
}
