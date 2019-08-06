import {
  Component, OnInit, Input, Output, EventEmitter, ElementRef, OnChanges
} from '@angular/core';

import { RunService } from '../run.service';
import * as momentImported from 'moment';

/**
 * Formats an input date string
 * Both displays the string and outputs the formatted string
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
   * The list of entities after being unioned
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
