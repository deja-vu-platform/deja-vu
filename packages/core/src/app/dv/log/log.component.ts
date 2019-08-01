import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'dv-log',
  templateUrl: './log.component.html'
})
export class LogComponent implements OnChanges {
  @Input() entity: any;

  ngOnChanges() {
    console.log(this.entity);
  }
}
