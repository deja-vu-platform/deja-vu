import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';

import { RunService } from '../run.service';

import * as momentImported from 'moment';


/**
 * Formats an input date string.
 * It both displays and outputs the formatted string.
 */
@Component({
  selector: 'dv-format-date',
  templateUrl: './format-date.component.html'
})
export class FormatDateComponent implements OnInit, OnChanges {
  /**
   * A date string that needs to be formatted
   */
  @Input() dateString: string;

  /**
   * The format method according to
   * https://devhints.io/moment
   */
  @Input() format: string;

  /**
   * The date formatted according to `format`
   */
  @Output() formattedDate = new EventEmitter<string>();
  _formattedDate = '';

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges() {
    // Work around the mement issue
    // https://github.com/ng-packagr/ng-packagr/issues/217
    const moment = momentImported;
    this._formattedDate = moment(this.dateString)
      .format(this.format);
    this.formattedDate.emit(this._formattedDate);
  }
}
