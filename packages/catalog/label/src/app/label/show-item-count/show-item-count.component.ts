import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../label.config';

import * as _ from 'lodash';

interface ItemCountRes {
  data: { itemCount: number };
}

@Component({
  selector: 'label-show-item-count',
  templateUrl: './show-item-count.component.html'
})
export class ShowItemCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  itemCount: number;

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
      const res = await this.dvs.get<ItemCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({ input: {} })
        }
      });
      this.itemCount = res.data.itemCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
