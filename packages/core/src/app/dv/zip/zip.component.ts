import {
  Component, EventEmitter, Input, OnChanges, Output
} from '@angular/core';

import * as _ from 'lodash';


/**
 * Zips arrays of input values into objects with the corresponding field names.
 * Requires: inputs.length === fieldNames.length
 * and inputs[i].length === inputs[j].length === n for every pair i, j
 * so that the emitted objects.length === n
 *
 * For example, if inputs=[[1,2], [a,b], [x,y]]
 * and fieldNames=['id', 'letter1', 'letter2'],
 * The objects emitted will be
 *   [{ id: 1, letter1: a, letter2: x }, { id: 2, letter1: b, letter2: y }]
 */
@Component({
  selector: 'dv-zip',
  templateUrl: './zip.component.html'
})
export class ZipComponent implements OnChanges {
  @Input() inputs: any[][] = [];
  @Input() fieldNames: string[] = [];
  @Output() objects = new EventEmitter<any[]>();

  ngOnChanges() {
    if (!_.isEmpty(this.inputs) &&
      this.inputs.length === this.fieldNames.length) {
      this.objects.emit(_.zip(...this.inputs)
        .map((objVals) => _.zipObject(this.fieldNames, objVals)));
    }
  }
}
