
import { Component, Input, OnChanges, OnDestroy, ElementRef} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Widget } from '../../../models/widget/widget';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'dv-map-widget',
  templateUrl: './map-widget.component.html',
  styleUrls: ['./map-widget.component.css']
})
export class MapWidgetComponent implements OnChanges, OnDestroy {
  @Input() widget: Widget;
  @Input() scale = 1;
  innerWidgets: Observable<Widget[]>;
  el: HTMLElement;

  private subscriptions = [];

  constructor(
    el: ElementRef,
    private projectService: ProjectService,
  ) {
    this.el = el.nativeElement;
  }

  ngOnChanges() {
    this.unsubscribe();

    // TODO this is very similar to the widgets, is there a way to generalize?
    this.subscriptions.push(
      this.widget.dimensions.subscribe(dimensions => {
        this.el.style.height = this.scale * dimensions.height + 'px';
        this.el.style.width = this.scale * dimensions.width + 'px';
      })
    );

    this.subscriptions.push(
      this.widget.position.subscribe(position => {
        this.el.style.top = this.scale * position.top + 'px';
        this.el.style.left = this.scale * position.left + 'px';
      })
    );

    this.innerWidgets = this.widget.innerWidgetIds.map(
      innerWidgetIds => this.projectService.getWidgets(innerWidgetIds)
    );
  }

  ngOnDestroy() {
    this.unsubscribe();
  }

  private unsubscribe() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
