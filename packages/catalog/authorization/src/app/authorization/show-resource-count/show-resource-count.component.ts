import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../authorization.config';

import * as _ from 'lodash';

interface ResourceCountRes {
  data: { resourceCount: number };
}

@Component({
  selector: 'authorization-show-resource-count',
  templateUrl: './show-resource-count.component.html'
})
export class ShowResourceCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  resourceCount: number;

  @Input() createdBy: string | undefined;
  @Input() viewableBy: string | undefined;

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
      const res = await this.dvs.get<ResourceCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              createdBy: this.createdBy,
              viewableBy: this.viewableBy
            }
          })
        }
      });
      this.resourceCount = res.data.resourceCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
