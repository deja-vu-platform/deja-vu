import {
  Component, OnInit, Input, Output, EventEmitter, ElementRef, OnChanges
} from '@angular/core';

import { RunService, OnExecSuccess } from '../run.service';
import * as _ from 'lodash';


@Component({
  selector: 'dv-intersect',
  templateUrl: './intersect.component.html'
})
export class IntersectComponent implements OnInit, OnChanges {
  /**
   * A list of lists that is going to be intersected
   */
  @Input() lists: any[][];

  /**
   * If the passed in entity is not a primitive value
   * A key can be used to signal their comparison field
   * If no key is passed in, the objects will all be identified as unique
   * More spec see documentation of Lodash at:
   *  https://lodash.com/docs/4.17.10#intersectionBy
   */
  @Input() key: string;

  /**
   * The list of entities after union
   */
  @Output() intersectList = new EventEmitter<any[]>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    const MINIMUM_INTERSECTION_LISTS = 2;

    // this.lists[0] added to avoid tslint error
    // issue thread: https://github.com/microsoft/TypeScript/issues/4130
    if (!!this.lists && this.lists.length >= MINIMUM_INTERSECTION_LISTS) {
      this.intersectList.emit(this.key ?
        _.intersectionBy(this.lists[0], ...this.lists, this.key)
        : _.intersection(this.lists[0], ...this.lists));
    } else {
      throw new Error ('pass in at least two lists for intersection');
    }

  }
}
