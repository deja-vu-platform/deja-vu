import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../group.config';

import * as _ from 'lodash';

interface GroupCountRes {
  data: { groupCount: number };
}

@Component({
  selector: 'group-show-group-count',
  templateUrl: './show-group-count.component.html'
})
export class ShowGroupCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  groupCount: number;

  @Input() withMemberId: string | undefined;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
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
      const res = await this.dvs.get<GroupCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              withMemberId: this.withMemberId
            }
          })
        }
      });
      this.groupCount = res.data.groupCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
