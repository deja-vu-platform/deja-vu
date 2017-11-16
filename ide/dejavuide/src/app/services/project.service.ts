import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { Widget, ClicheMap } from '../models/widget/widget';

@Injectable()
export class ProjectService {
  allCliches = new ReplaySubject<ClicheMap>(1);
  selectedWidget = new ReplaySubject<Widget>(1);
  widgetUpdateListener = new ReplaySubject<boolean>(1);

  updateClicheMap(updatedClicheMap: ClicheMap) {
    this.allCliches.next(updatedClicheMap);
  }

  updateSelectedWidget(newSelectedWidget: Widget) {
    this.selectedWidget.next(newSelectedWidget);
  }

  widgetUpdated() {
    this.widgetUpdateListener.next(true);
  }
}
