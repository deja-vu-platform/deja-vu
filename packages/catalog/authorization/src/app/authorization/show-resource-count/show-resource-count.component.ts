import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../authorization.config';
import { Resource } from '../shared/authorization.model';

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
  public resourceCount: number;

  @Input() createdBy: string | undefined;
  @Input() viewableBy: string | undefined;

  @Input() resourceIds: string[] | undefined;
  @Input() set resources(value: Resource[]) {
    this.resourceIds = _.map(value, 'id');
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
      this.resourceCount = this.resourceIds.length;
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<ResourceCountRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              createdBy: this.createdBy,
              viewableBy: this.viewableBy
            }
          }
        }
      })
        .pipe(map((res: ResourceCountRes) => res.data.resourceCount))
        .subscribe((resourceCount) => {
          this.resourceCount = resourceCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.resourceIds && this.gs);
  }
}
