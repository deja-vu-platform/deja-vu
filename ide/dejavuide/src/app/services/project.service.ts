import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { Widget, WidgetMap } from '../models/widget/widget';

@Injectable()
export class ProjectService {
  allWidgets = new ReplaySubject<WidgetMap>(1);
  selectedWidget = new ReplaySubject<Widget>(1);

  updateAllWidgets(updatedAllWidgets: WidgetMap) {
    this.allWidgets.next(updatedAllWidgets);
  }

  updateSelectedWidget(newSelectedWidget: Widget) {
    this.selectedWidget.next(newSelectedWidget);
  }
}
