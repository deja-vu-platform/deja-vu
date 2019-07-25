import {
  Component, OnInit, Input, Output, EventEmitter, ElementRef, OnChanges
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
  _difference;

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  /**
   * if the original list is null, it will output and empty list
   * if the subtractor is null, it will output the original list
   */
  ngOnChanges() {
    if (!this.key) {
      this._difference = _.difference(this.array, ...this.values);
      this.difference.emit(this._difference);
    } else {
      this._difference = _.differenceBy(this.array, ...this.values, this.key);
      this.difference.emit(this._difference);
    }
  }
}
