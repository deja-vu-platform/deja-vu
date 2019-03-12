import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../follow.config';
import { Publisher } from '../shared/follow.model';

import * as _ from 'lodash';

interface PublisherCountRes {
  data: { publisherCount: number };
}

@Component({
  selector: 'follow-show-publisher-count',
  templateUrl: './show-publisher-count.component.html'
})
export class ShowPublisherCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  public publisherCount: number;

  @Input() followedById: string | undefined;

  @Input() publisherIds: string[] | undefined;
  @Input() set publisher(value: Publisher[]) {
    this.publisherIds = _.map(value, 'id');
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
      this.publisherCount = this.publisherIds.length;
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<PublisherCountRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              followedById: this.followedById
            }
          }
        }
      })
        .pipe(map((res: PublisherCountRes) => res.data.publisherCount))
        .subscribe((publisherCount) => {
          this.publisherCount = publisherCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.publisherIds && this.gs);
  }
}
