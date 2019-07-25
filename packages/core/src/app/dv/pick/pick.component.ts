import {
  Component, OnInit, Input, Output, EventEmitter, ElementRef, OnChanges
} from '@angular/core';

import { RunService } from '../run.service';
import * as _ from 'lodash';

/**
 * Pick one of multiple fields of each object in an array
 */
@Component({
  selector: 'dv-pick',
  templateUrl: './pick.component.html'
})
export class PickComponent implements OnInit, OnChanges {
  /**
   * A list of objects
   */
  @Input() entities: any[];

  /**
   * A list of keys to pick
   */
  @Input() keys: string[];

  /**
   * If exist, must be the same length as keys
   * Maps a new fieldName onto the picked key
   */
  @Input() newKeyNames: string[];

  /**
   * If set to true, the function will flatten the object
   * and make the value stand on its own
   * When flatten is set to true, keys.length() must be 1.
   */
  @Input() flatten: false;

  /**
   * The list of entities with the picked fields
   */
  @Output() pickedEntities = new EventEmitter<any[]>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    if (this.flatten) {
      if (!this.keys) {
        throw new Error('must pass in fields to pick.');
      } else if (this.keys.length !== 1) {
        throw new Error('can only have one field when flatten is true');
      } else {
        this.pickedEntities.emit(_.map(this.entities, this.keys[0]));
      }
    } else {
      if (!this.newKeyNames) {
        this.pickedEntities.emit(_.map(this.entities,
          (value) => _.pick(value, this.keys)));
      } else if (this.newKeyNames.length === this.keys.length) {
        this.pickedEntities.emit(_.map(this.entities,
          (value) => {
          const constructObject = {};
          for (const i of Object.keys(this.keys)) {
            constructObject[this.newKeyNames[i]] = value[this.keys[i]];
          }

          return constructObject;
          }
        ));
      } else {
        throw new Error('newKeyNames must have the same length as keys');
      }

    }
  }
}
