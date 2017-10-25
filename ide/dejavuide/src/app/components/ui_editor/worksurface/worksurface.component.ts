import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';

import { Widget } from '../../../models/widget/widget';
import { Dimensions, Position } from '../../../utility/utility';

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
    // TODO probably will have to do other things
  }

  @Input() dimensions: Dimensions;

  @Output() onChange = new EventEmitter<boolean>();

  _widget: Widget;

  handleChange() {
    this.onChange.emit(true);
  }

  ngAfterViewInit() {
    const _this = this;
    $('.work-surface').droppable({
      accept: 'dv-widget',
      hoverClass: 'highlight',
      tolerance: 'fit',
      drop: function (event, ui) {
          _this.onDropFinished();
      }
    });
  }

  onDropFinished(/** TODO */) {
    // If new widget, add to the selected widget
    // else, put it at the top
    console.log('dropped');
  }
}
