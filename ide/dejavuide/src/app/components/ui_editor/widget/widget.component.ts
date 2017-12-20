import { Component, Input, OnInit, AfterViewInit, ElementRef } from '@angular/core';

import { Cliche } from '../../../models/cliche/cliche';
import { Widget, UserWidget } from '../../../models/widget/widget';
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

      projectService.widgetUpdateListener.subscribe(() => {
        this.getInnerWidgets();
      });
  }


  ngOnInit() {
    // get inner widgets
    this.getInnerWidgets();
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
      this.makeWidgetDraggable();
      this.makeWidgetResizable();
    }
  }

  private makeWidgetDraggable() {
    $(this.el).draggable({
      containment: '.work-surface',
      start: (e, ui) => {
        ui.helper.dvWidget = this.widget;
        ui.helper.css({
          'z-index': 9999
        });
    },
      stop: (e, ui) => {
        this.widget.updatePosition(ui.position);
        // projectService.widgetUpdated() is called in the worksurface,
        // but important to do so here because drop() is called *before*
        // dragging stops.
        this.projectService.widgetUpdated();
        ui.helper.css({
          'z-index': 'auto'
        });
      },
    });
  }

  private makeWidgetResizable() {
    const dragHandle_se = $('.drag-handle');

    $(this.el).resizable({
      // handles: {
      //   'se': dragHandle_se,
      // },
      handles: 'n, e, s, w, ne, nw, se, sw',
      // minHeight: 0,
      // minWidth: 0,
      resize: (e, ui) => {
        const newDimensions = { height: ui.size.height, width: ui.size.width};
        const newPosition = {top: ui.position.top, left: ui.position.left};
        this.widget.updatePosition(newPosition);
        this.widget.updateDimensions(newDimensions);
      },
      stop: (e, ui) => {
        // not super important to update as you resize so just do it at the end
        this.projectService.widgetUpdated();
      }
    });
  }

  private getInnerWidgets() {
    this.innerWidgets = [];
    if (this.widget && this.widget.isUserType()) {
      for (const innerWidgetId of this.widget.getInnerWidgetIds()) {
        this.innerWidgets.push(this.widget.getInnerWidget(innerWidgetId));
      }
    }
  }
}
