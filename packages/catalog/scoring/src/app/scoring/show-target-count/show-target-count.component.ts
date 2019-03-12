import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../scoring.config';
import { Target } from '../shared/scoring.model';

import * as _ from 'lodash';

interface TargetCountRes {
  data: { targetCount: number };
}

@Component({
  selector: 'scoring-show-target-count',
  templateUrl: './show-target-count.component.html'
})
export class ShowTargetCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  targetCount: number;

  @Input() targetIds: string[] | undefined;
  @Input() set target(value: Target[]) {
    this.targetIds = _.map(value, 'id');
  }

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
    } else {
      this.targetCount = this.targetIds.length;
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<TargetCountRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              targetIds: this.targetIds
            }
          }
        }
      })
        .pipe(map((res: TargetCountRes) => res.data.targetCount))
        .subscribe((targetCount) => {
          this.targetCount = targetCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.targetIds && this.gs);
  }
}
