import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import * as _ from 'lodash';

import { ShowLabelComponent } from '../show-label/show-label.component';

import { API_PATH } from '../label.config';
import { Label } from '../shared/label.model';

interface LabelsRes {
  data: { labels: Label[] };
  errors: { message: string }[];
}

@Component({
  selector: 'label-show-labels',
  templateUrl: './show-labels.component.html',
  styleUrls: ['./show-labels.component.css']
})
export class ShowLabelsComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // Fetch rules
  @Input() itemId: string | undefined;

  // Presentation inputs
  @Input() noLabelsToShowText = 'No labels to show';

  @Input() showLabel: Action = {
    type: <Type<Component>>ShowLabelComponent
  };

  @Output() labels = new EventEmitter<Label[]>();

  _labels: Label[] = [];

  showLabels;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showLabels = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<LabelsRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              itemId: this.itemId
            }
          },
          extraInfo: { returnFields: 'id' }
        }
      })
        .subscribe((res) => {
          this._labels = res.data.labels;
          this.labels.emit(this._labels);
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
