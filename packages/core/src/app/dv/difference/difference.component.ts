import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';

import { RunService } from '../run.service';

import * as _ from 'lodash';

/**
 * Outputs an array with values in the first array
 * and not in the second array
 */
@Component({
  selector: 'dv-difference',
  templateUrl: './difference.component.html'
})
export class DifferenceComponent implements OnInit, OnChanges {
  /** A list of entities to be subtracted by */
  @Input() array: any[];

  /** Lists of entities to subtract with */
  @Input() values: any[][];

  /** compare only one field when the original and subtractor are objects */
  @Input() key: string;

  /** The output list */
  @Output() difference = new EventEmitter<any[]>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  /**
   * if the original list is `null`, it outputs an empty list
   * if the subtractor is `null`, it outputs the original list
   */
  ngOnChanges() {
    if (!this.key) {
      this.difference.emit(_.difference(this.array, ...this.values));
    } else {
      this.difference.emit(
        _.differenceBy(this.array, ...this.values, this.key));
    }
  }
}
