import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../label.config';

import * as _ from 'lodash';

interface ItemCountRes {
  data: { itemCount: number };
}

@Component({
  selector: 'label-show-item-count',
  templateUrl: './show-item-count.component.html'
})
export class ShowItemCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  itemCount: number;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

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
      this.gs.get<ItemCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({ input: {} })
        }
      })
        .pipe(map((res: ItemCountRes) => res.data.itemCount))
        .subscribe((itemCount) => {
          this.itemCount = itemCount;
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
