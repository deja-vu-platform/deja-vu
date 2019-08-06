import {
  Component, OnInit, Input, Output, EventEmitter, ElementRef, OnChanges
} from '@angular/core';

import { RunService } from '../run.service';
import * as _ from 'lodash';


@Component({
  selector: 'dv-sum',
  templateUrl: './sum.component.html'
})
export class SumComponent implements OnInit, OnChanges {
  /**
   * A list where the objects will be sumed
   */
  @Input() arrayToSum: any[];

  /**
   * If the passed in entity is not a number
   * A key can be used to inditae the field to sum
   */
  @Input() key: string;

  /**
   * The list of entities after being unioned
   */
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
