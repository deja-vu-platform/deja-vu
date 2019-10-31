import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../follow.config';

import * as _ from 'lodash';

interface PublisherCountRes {
  data: { publisherCount: number };
}

@Component({
  selector: 'follow-show-publisher-count',
  templateUrl: './show-publisher-count.component.html'
})
export class ShowPublisherCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  publisherCount: number;

  @Input() followedById: string | undefined;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<PublisherCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              followedById: this.followedById
            }
          })
        }
      });
      this.publisherCount = res.data.publisherCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
