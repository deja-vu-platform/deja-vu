import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';

import { RunService } from '../run.service';

import * as _ from 'lodash';


@Component({
  selector: 'dv-intersect',
  templateUrl: './intersect.component.html'
})
export class IntersectComponent implements OnInit, OnChanges {
  private static readonly MINIMUM_INTERSECTION_LISTS = 2;
  /**
   * A list of lists to intersect
   */
  @Input() lists: any[][];

  /**
   * If the passed in entity is not a primitive value a key can be used
   * for comparisons. If no key is passed in, SameValueZero is used for
   * equality comparisons.
   * See https://lodash.com/docs/4.17.10#intersectionBy
   */
  @Input() key: string;

  @Output() intersectList = new EventEmitter<any[]>();


  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    // this.lists[0] added to avoid tslint error
    // issue thread: https://github.com/microsoft/TypeScript/issues/4130
    if (!!this.lists && this.lists.length >=
      IntersectComponent.MINIMUM_INTERSECTION_LISTS) {
      this.intersectList.emit(this.key ?
        _.intersectionBy(this.lists[0], ...this.lists, this.key)
        : _.intersection(this.lists[0], ...this.lists));
    } else {
      throw new Error ('pass in at least two lists for intersection');
    }
  }
}
