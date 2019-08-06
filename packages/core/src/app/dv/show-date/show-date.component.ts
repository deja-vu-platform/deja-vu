import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';


@Component({
  selector: 'dv-show-date',
  templateUrl: './show-date.component.html',
  providers: [ DatePipe ]
})
export class ShowDateComponent {
  _date: Date;

  @Input()
  set date(d: Date | string | number) {
    // hack to prevent ts from complaning that `this.date` is not a string.
    // It might not be a string, but that's OK (the Date constructor also takes
    // numbers and dates)
    this._date = new Date(<string> d);
  }

  @Input() format = 'EEE MMM d, y h:mm a';
}
