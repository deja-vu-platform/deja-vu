import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../group.config';

import * as _ from 'lodash';


interface MemberCountRes {
  data: { memberCount: number };
}

@Component({
  selector: 'group-show-member-count',
  templateUrl: './show-member-count.component.html'
})
export class ShowMemberCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  memberCount: number;

  @Input() inGroupId: string | undefined;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

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
      const res = await this.dvs.get<MemberCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              inGroupId: this.inGroupId
            }
          })
        }
      });
      this.memberCount = res.data.memberCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
