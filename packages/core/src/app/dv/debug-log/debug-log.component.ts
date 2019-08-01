import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'dv-debug-log',
  templateUrl: './debug-log.component.html'
})
export class DebugLogComponent implements OnChanges {
  @Input() entity: any;

  ngOnChanges() {
    console.log(this.entity);
  }
}
