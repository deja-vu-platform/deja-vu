import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';

import {allElementsFromPoint} from '../../common/utility/utility';
import { Widget, WidgetType } from '../../../models/widget/widget';

import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;

@Component({
  selector: 'dv-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css'],
})
export class WidgetComponent implements AfterViewInit {
  @Input() allWidgets:  Map<string, Map<string, Widget>>;
  @Input() widget: Widget;
  @Input() isSelected = false;
  @Input() isMovable = false;

  @Output() onChange = new EventEmitter<boolean>();

  widgetType = WidgetType;
  Widget = Widget;

  private el: HTMLElement;

  constructor(el: ElementRef) {
      this.el = el.nativeElement;
  }

  ngAfterViewInit() {
    this.el.style.top = this.widget.getPosition().top + 'px';
    this.el.style.left = this.widget.getPosition().left + 'px';
    this.el.style.position = 'absolute';

    if (this.isSelected || this.isMovable) {
      const _this = this;
      $(this.el).draggable({
        containment: '.work-surface',
        stop: function(e, ui){
          _this.widget.updatePosition(ui.position);
          _this.onChange.emit(true);
        },
      });
    }
  }

  handleChange() {
    this.onChange.emit(true);
  }


  // private makeWorkSurfaceResizable(workSurface, userWidget) {
  //   const widgetId = userWidget.meta.id;

  //   const dragHandle_se = $('<span></span>');
  //   dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
  //   dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
  //   dragHandle_se.attr('id', 'drag-handle-se' + '_' + widgetId);

  //   workSurface.append(dragHandle_se);


  //   $(workSurface).resizable({
  //     handles: {
  //       'se': dragHandle_se,
  //     },
  //     minHeight: 0,
  //     minWidth: 0,
  //     resize: function (e, ui) {
  //       // TODO need to DRY this up and/or combine with the widget container methods
  //       const newDimensions = { height: ui.size.height / currentZoom, width: ui.size.width / currentZoom };
  //       widgetEditsManager.updateCustomProperties(userWidget, userWidget.meta.id, 'dimensions', newDimensions);

  //     },
  //     stop: function (e, ui) {
  //       // not super important to update as you resize so just do it at the end
  //       miniNav.updateMiniNavInnerWidgetSizes(userWidget, currentZoom);
  //       grid.setUpGrid();
  //     }
  //   });
  // }

  
  onDropFinished(dragHandle, widget) {
    const widgetId = widget.meta.id;

    if (dragHandle.associated) {
      const parent = outermostWidget.getInnerWidget(widgetId, true);
      if (parent.meta.id === outermostWidget.meta.id) { // fixme SUPERHACK :'(
        shiftOrder(widgetId, outermostWidget);
      }
    }
    const firstInnerWidgetId = outermostWidget.getPath(widgetId)[1]; // this should always exist
    if (!firstInnerWidgetId) {
      console.log('something went wrong in onDropFinished');
    }

    const firstInnerWidget = outermostWidget.getInnerWidget(firstInnerWidgetId);

    const overallStyles = widgetEditsManager
      .getMostRelevantOverallCustomChanges(
      outermostWidget, widgetId);

    this.loadUserWidgetIntoWorkSurface(outermostWidget, currentZoom);
    grid.setUpGrid();
  }




}
