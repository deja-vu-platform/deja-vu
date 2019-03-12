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

interface LabelCountRes {
  data: { labelCount: number };
}

@Component({
  selector: 'label-show-label-count',
  templateUrl: './show-label-count.component.html'
})
export class ShowLabelCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  labelCount: number;

  @Input() itemId: string | undefined;

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
      this.gs.get<LabelCountRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              itemId: this.itemId
            }
          }
        }
      })
        .pipe(map((res: LabelCountRes) => res.data.labelCount))
        .subscribe((labelCount) => {
          this.labelCount = labelCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
