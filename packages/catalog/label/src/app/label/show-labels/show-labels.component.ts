import {
  Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
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
export class ShowLabelsComponent implements OnInit, OnChanges {
  // Fetch rules
  // If undefined then the fetched labels are not filtered by that property
  @Input() itemId: string | undefined;

  @Input() showLabel: Action = {
    type: <Type<Component>>ShowLabelComponent
  };

  @Input() noLabelsToShowText = 'No labels to show';
  labels: Label[] = [];

  showLabels;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showLabels = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchLabels();
  }

  ngOnChanges() {
    this.fetchLabels();
  }

  fetchLabels() {
    if (this.gs) {
      this.gs
        .get<LabelsRes>(this.apiPath, {
          params: {
            query: `
              query Labels($input: LabelsInput!) {
                labels(input: $input) {
                  id
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                itemId: this.itemId
              }
            })
          }
        })
        .subscribe((res) => {
          this.labels = res.data.labels;
        });
    }
  }
}
