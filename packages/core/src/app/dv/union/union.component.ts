import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';

import { RunService } from '../run.service';

import * as _ from 'lodash';


@Component({
  selector: 'dv-union',
  templateUrl: './union.component.html'
})
export class UnionComponent implements OnInit, OnChanges {
  private static readonly MINIMUM_UNION_LISTS = 2;
  /**
   * A list of lists to union
   */
  @Input() lists: any[][];

  /**
   * If the passed in entity is not a primitive value a key can be used
   * for comparisons. If no key is passed in, SameValueZero is used for
   * equality comparisons.
   * See https://lodash.com/docs/4.17.10#unionBy
   */
  @Input() key: string;

  @Output() unionList = new EventEmitter<any[]>();
  _unionList = [];

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    // this.lists[0] added to avoid tslint error
    // issue thread: https://github.com/microsoft/TypeScript/issues/4130
    if (!!this.lists &&
        this.lists.length >= UnionComponent.MINIMUM_UNION_LISTS) {
      this.unionList.emit(_.unionBy(this.lists[0], ...this.lists, this.key));
    } else {
      throw new Error('pass in at least two lists for union');
    }
  }
}
