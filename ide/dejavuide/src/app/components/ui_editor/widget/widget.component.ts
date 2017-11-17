import { Component, Input, OnInit, AfterViewInit, ElementRef } from '@angular/core';

import {allElementsFromPoint} from '../../../utility/utility';
import { Widget, UserWidget, WidgetMap } from '../../../models/widget/widget';

import { ProjectService } from '../../../services/project.service';

// Widgets are drag-and-droppable
import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;

@Component({
  selector: 'dv-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css'],
})
export class WidgetComponent implements AfterViewInit, OnInit {
  @Input() widget: Widget;
  @Input() isSelected = false;
  /**
   * Only the direct children of a widget are movable when a widget is selected.
   * So any grandchildren and so on are not movable in this view.
   */
  @Input() isMovable = false;

  readonly Widget = Widget;
  innerWidgets: Widget[] = [];

  private el: HTMLElement;

  constructor(
    el: ElementRef,
    private projectService: ProjectService
  ) {
      this.el = el.nativeElement;
  }


  ngOnInit() {
    // get inner widgets
    if (this.widget.isUserType()) {
      for (const innerWidgetId of this.widget.getInnerWidgetIds()) {
        this.innerWidgets.push(Widget.getWidget(this.widget.getWidgetMap(), innerWidgetId));
      }
    }
  }

  ngAfterViewInit() {
    // Change the position of the widget in view. This is the best way to do
    // it without removing view encapsulation.
    this.el.style.top = this.widget.getPosition().top + 'px';
    this.el.style.left = this.widget.getPosition().left + 'px';
    this.el.style.position = 'absolute';

    // Initiate draggable based on certain things
    // If it's the selected widget, it is always movable
    // Otherwise make it movable based on the flag.
    if (this.isSelected || this.isMovable) {
      $(this.el).draggable({
        containment: '.work-surface',
        stop: (e, ui) => {
          this.widget.updatePosition(ui.position);
          this.projectService.widgetUpdated();
        },
      });

      this.makeWidgetResizable();
    }
  }

  private makeWidgetResizable() {
  // TODO Resizable code

  //   const widgetId = _widget.getId();

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
  }

  /**
   * On drop finished, pass on this event to the outermost container
   * (work surface), which can handle what to do with it.
   */
  onDropFinished() {
    // TODO
  }




}
