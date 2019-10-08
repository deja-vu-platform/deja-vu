import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';

import { RunService } from '../run.service';

import * as _ from 'lodash';


@Component({
  selector: 'dv-sum',
  templateUrl: './sum.component.html'
})
export class SumComponent implements OnInit, OnChanges {
  /**
   * The array containing the values to sum
   */
  @Input() arrayToSum: any[];

  /**
   * If the passed in entity is not a number, a key can be used to indicate the
   * field to sum
   */
  @Input() key: string;

  @Output() sum = new EventEmitter<number>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    if (this.key) {
      this.sum.emit(_.sumBy(this.arrayToSum, this.key));
    } else {
      this.sum.emit(_.sum(this.arrayToSum));
    }
  }
}
