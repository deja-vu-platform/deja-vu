import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { ShowLabelComponent } from '../show-label/show-label.component';

import { Label } from '../shared/label.model';


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
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
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
        .get<{ data: { labels: Label[] } }>('/graphql', {
          params: {
            query: `
              query Labels($input: LabelsInput!) {
                labels(input: $input)
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
