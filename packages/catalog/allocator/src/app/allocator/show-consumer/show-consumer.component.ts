import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../allocator.config';

interface ConsumerOfResourceRes {
  data: {consumerOfResource: string};
}


@Component({
  selector: 'allocator-show-consumer',
  templateUrl: './show-consumer.component.html'
})
export class ShowConsumerComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Output() consumerId = new EventEmitter();
  _consumerId: string;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {}

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
      this.gs.get<ConsumerOfResourceRes>(this.apiPath, {
        params: {
          variables: JSON.stringify({
            input: {
              resourceId: this.resourceId,
              allocationId: this.allocationId
            }
          }),
          extraInfo: { }
        },
      })
      .pipe(map((res: ConsumerOfResourceRes) => res.data.consumerOfResource))
      .subscribe((consumerId) => {
        this._consumerId = consumerId;
        this.consumerId.emit(consumerId);
      });
    }
  }

  private canEval(): boolean {
    return !!(this.resourceId && this.allocationId && this.gs);
  }
}
