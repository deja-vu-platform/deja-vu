import { Component, Input, OnInit, ElementRef, OnDestroy } from '@angular/core';

import { Cliche } from '../../../models/cliche/cliche';
import { Widget, UserWidget } from '../../../models/widget/widget';

@Component({
  selector: 'dv-widget-display',
  templateUrl: './widget-display.component.html',
  styleUrls: ['./widget-display.component.css'],
})
export class WidgetDisplayComponent implements OnInit, OnDestroy {
  @Input() value;
  @Input() userApp;
  @Input() widget: Widget;
  @Input()
  set activated(isActivated: boolean) {
    // make sure this component is fully loaded before running this code
    if (this.widget && isActivated) {
      // check for any changes that might have occured elsewhere
      this.updateStylesToShow();
    }
  }

  private el: HTMLElement;

  subscriptions = [];

  constructor(
    el: ElementRef,
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

    this.subscriptions.push(
      this.widget.styles.subscribe(styles => {
        this.updateStylesToShow();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  private updateStylesToShow() {
    const stylesToShow = this.widget.getCustomStylesToShow(this.userApp);

    Object.keys(stylesToShow).forEach((name) => {
      this.el.style[name] = stylesToShow[name];
    });
  }
}
