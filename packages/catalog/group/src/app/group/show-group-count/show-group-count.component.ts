import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../group.config';
import { Group } from '../shared/group.model';

import * as _ from 'lodash';

interface GroupCountRes {
  data: { groupCount: number };
}

@Component({
  selector: 'group-show-group-count',
  templateUrl: './show-group-count.component.html'
})
export class ShowGroupCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  groupCount: number;

  @Input() withMemberId: string | undefined;


  @Input() groupIds: string[] | undefined;
  @Input() set group(value: Group[]) {
    this.groupIds = _.map(value, 'id');
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
      this.groupCount = this.groupIds.length;
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<GroupCountRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              withMemberId: this.withMemberId
            }
          }
        }
      })
        .pipe(map((res: GroupCountRes) => res.data.groupCount))
        .subscribe((groupCount) => {
          this.groupCount = groupCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.groupIds && this.gs);
  }
}
