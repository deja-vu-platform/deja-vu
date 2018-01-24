import { Component, Input, OnChanges, OnInit, AfterViewInit, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';

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
export class WidgetComponent implements OnChanges, AfterViewInit, OnInit, OnDestroy {
  @Input() widget: Widget;
  @Input() isSelected = false;
  /**
   * Only the direct children of a widget are movable when a widget is selected.
   * So any grandchildren and so on are not movable in this view.
   */
  @Input() isMovable = false;

  innerWidgets: Widget[] = [];

  private el: HTMLElement;
  private subscriptions = [];

  constructor(
    el: ElementRef,
    private projectService: ProjectService,
    private ref: ChangeDetectorRef
  ) {
      this.el = el.nativeElement;
      // this.projectService.widgetUpdateListener.subscribe(() => {
      //   this.getInnerWidgets();
      // });
  }

  ngOnChanges() {
  }

  ngOnInit() {
    // this.el.style.top = this.widget.getPosition().top + 'px';
    // this.el.style.left = this.widget.getPosition().left + 'px';
    // this.el.style.position = 'absolute';

    // // get inner widgets
    // this.getInnerWidgets();

    // this.updateStylesToShow();
    // this.subscriptions.push(
    // this.projectService.widgetUpdateListener.subscribe(() => {
    //   this.getInnerWidgets();
    //   // const localStyles = this.widget.getLocalCustomStyles();
    //   this.updateStylesToShow();
    // }));
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

    this.subscriptions.push(
      this.widget.innerWidgetIds.subscribe(innerWidgetIds => {
        this.getInnerWidgets();
        this.ref.detectChanges();
      })
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

  ngAfterViewInit() {
    // Change the position of the widget in view. This is the best way to do
    // it without removing view encapsulation.
    // this.el.style.top = this.widget.getPosition().top + 'px';
    // this.el.style.left = this.widget.getPosition().left + 'px';
    // this.el.style.position = 'absolute';

    // console.log(this.el.style.top, this.el.style.left);

    // Initiate draggable based on certain things
    // If it's the selected widget, it is always movable
    // Otherwise make it movable based on the flag.
    // if (this.isSelected || this.isMovable) {
    //   this.makeWidgetDraggable();
    //   this.makeWidgetResizable();
    // }
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
        // this.projectService.widgetUpdated();
      }
    });
  }

  private getInnerWidgets() {
    if (this.widget) {
      this.innerWidgets = [];
      const userApp = this.projectService.getProject().getUserApp();
      for (const innerWidgetId of this.widget.getInnerWidgetIds()) {
        this.innerWidgets.push(userApp.getWidget(innerWidgetId));
      }
    }
  }

  private updateStylesToShow() {
    const userApp = this.projectService.getProject().getUserApp();
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
