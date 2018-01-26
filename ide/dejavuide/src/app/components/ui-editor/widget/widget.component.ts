import { Component, Input, OnInit, ElementRef, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Cliche } from '../../../models/cliche/cliche';
import { Widget, UserWidget } from '../../../models/widget/widget';
import { ProjectService } from '../../../services/project.service';

// Widgets are drag-and-droppable
import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import { isAbsolute } from 'path';

const $ = <any>jQuery;

@Component({
  selector: 'dv-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css'],
})
export class WidgetComponent implements OnInit, OnDestroy {
  _activated: boolean;
  @Input()
  set activated(isActivated: boolean) {
    this._activated = isActivated;
    // make sure this component is fully loaded before running this code
    if (this.widget && isActivated) {
      // check for any changes that might have occured elsewhere
      this.updateStylesToShow();
    }
  }

  @Input() widget: Widget;
  @Input() isSelected = false;
  /**
   * Only the direct children of a widget are movable when a widget is selected.
   * So any grandchildren and so on are not movable in this view.
   */
  @Input() isMovable = false;

  innerWidgets: Observable<Widget[]>;

  private el: HTMLElement;
  private subscriptions = [];

  constructor(
    el: ElementRef,
    private projectService: ProjectService,
  ) {
      this.el = el.nativeElement;
  }

  ngOnInit() {
    this.subscriptions.push(
      this.widget.dimensions.subscribe(dimensions => {
        this.el.style.height = dimensions.height + 'px';
        this.el.style.width = dimensions.width + 'px';
      })
    );

    this.subscriptions.push(
      this.widget.position.subscribe(position => {
        this.el.style.top = position.top + 'px';
        this.el.style.left = position.left + 'px';
      })
    );

    this.innerWidgets = this.widget.innerWidgetIds.map(
      innerWidgetIds => this.projectService.getWidgets(innerWidgetIds)
    );

    this.subscriptions.push(
      this.widget.styles.subscribe(styles => {
        this.updateStylesToShow();
      })
    );

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
        ui.helper.css({
          'z-index': 'auto'
        });
      },
    });
  }

  private makeWidgetResizable() {
    const dragHandle_se = $('.drag-handle');

    $(this.el).resizable({
      handles: 'n, e, s, w, ne, nw, se, sw',
      // minHeight: 0,
      // minWidth: 0,
      resize: (e, ui) => {
        const newDimensions = { height: ui.size.height, width: ui.size.width};
        const newPosition = {top: ui.position.top, left: ui.position.left};
        this.widget.updatePosition(newPosition);
        this.widget.updateDimensions(newDimensions);
      }
    });
  }

  private updateStylesToShow() {
    const userApp = this.projectService.getUserApp();
    const stylesToShow = this.widget.getCustomStylesToShow(userApp);

    Object.keys(stylesToShow).forEach((name) => {
      this.el.style[name] = stylesToShow[name];
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
    console.log('destroyed');
  }
}
