import {
  Component, OnInit, Input, Output, EventEmitter, ElementRef, OnChanges
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
   * A list of lists that is going to be unioned
   */
  @Input() lists: any[][];

  /**
   * If the passed in entity is not a primitive value
   * A key can be used to signal their comparison field
   * If no key is passed in, the objects will all be identified as unique
   * More spec see documentation of Lodash at:
   *  https://lodash.com/docs/4.17.10#unionBy
   */
  @Input() key: string;

  /**
   * The list of entities after being unioned
   */
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
    if ( !!this.lists && this.lists.length >= UnionComponent.MINIMUM_UNION_LISTS ) {
      this.unionList.emit(_.unionBy(this.lists[0], ...this.lists, this.key));
    } else {
      throw new Error('pass in at least two lists for union');
    }
  }
}
