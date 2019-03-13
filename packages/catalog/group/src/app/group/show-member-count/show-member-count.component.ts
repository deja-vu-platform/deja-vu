import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../group.config';

import * as _ from 'lodash';

interface MemberCountRes {
  data: { memberCount: number };
}

@Component({
  selector: 'group-show-member-count',
  templateUrl: './show-member-count.component.html'
})
export class ShowMemberCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  memberCount: number;

  @Input() inGroupId: string | undefined;

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
      this.gs.get<MemberCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              inGroupId: this.inGroupId
            }
          })
        }
      })
        .pipe(map((res: MemberCountRes) => res.data.memberCount))
        .subscribe((memberCount) => {
          this.memberCount = memberCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
