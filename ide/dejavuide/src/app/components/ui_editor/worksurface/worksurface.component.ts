import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';

import { Widget } from '../../../models/widget/widget';
import { Dimensions, Position } from '../../common/utility/utility';

import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;

@Component({
  selector: 'dv-worksurface',
  templateUrl: './worksurface.component.html',
  styleUrls: ['./worksurface.component.css']
})
export class WorkSurfaceComponent implements AfterViewInit {
  @Input() currentZoom: number;
  @Input() allWidgets:  Map<string, Map<string, Widget>>;
  @Input() set widget(val: Widget) {
    // set up things
    this._widget = val;
  }

  @Input() dimensions: Dimensions;

  @Output() onChange = new EventEmitter<boolean>();

  _widget: Widget;

  handleChange() {
    this.onChange.emit(true);
  }

  onAfterViewInit() {
    $('.work-surface').droppable({
      accept: "dv-widget",
      hoverClass: "highlight",
      tolerance: "fit",
      drop: function (event, ui) {
          console.log('dropped');
      }
    });
  }

  /**
   * enables it if its elements have already been created,
   * otherwise loads the elements into the DOM
   * @param userWidget
   * @param zoom
   */
  loadUserWidget(userWidget) {
    // grid.setUpGrid();
  }
}
