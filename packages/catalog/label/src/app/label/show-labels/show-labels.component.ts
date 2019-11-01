import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { ShowLabelComponent } from '../show-label/show-label.component';

import { API_PATH } from '../label.config';
import { Label } from '../shared/label.model';

import * as _ from 'lodash';


interface LabelsRes {
  data: { labels: Label[] };
  errors: { message: string }[];
}

@Component({
  selector: 'label-show-labels',
  templateUrl: './show-labels.component.html',
  styleUrls: ['./show-labels.component.css']
})
export class ShowLabelsComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges, OnDestroy {
  @Input() waitOn: string[];
  // Fetch rules
  @Input() itemId: string | undefined;

  // Presentation inputs
  @Input() noLabelsToShowText = 'No labels to show';

  @Input() showLabel: ComponentValue = {
    type: <Type<Component>>ShowLabelComponent
  };

  @Output() labels = new EventEmitter<Label[]>();

  _labels: Label[] = [];

  showLabels;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showLabels = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => { this.load(); })
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<LabelsRes>(this.apiPath, () => ({
        params: {
          inputs: JSON.stringify({
            input: {
              itemId: this.itemId
            }
          }),
          extraInfo: { returnFields: 'id' }
        }
      }));
      this._labels = res.data.labels;
      this.labels.emit(this._labels);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
