import {
  Component, Input, OnChanges, Output, EventEmitter
} from '@angular/core';

import * as _ from 'lodash';


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
      this.objects.emit(_.zip(...this.inputs).map(objVals =>
        _.zipObject(this.fieldNames, objVals)));
    }
  }
}
