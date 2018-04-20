import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';


import {
  GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

interface ConsumerOfResourceRes {
  data: {consumerOfResource: string};
}

const GRAPHQL_ENDPOINT = '/graphql';

@Component({
  selector: 'allocator-show-consumer',
  template: '{{_consumerId}}'
})
export class ShowConsumerComponent implements OnChanges, OnInit {
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Output() consumerId = new EventEmitter();
  _consumerId: string;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.update();
  }

  ngOnChanges() {
    this.update();
  }

  update() {
    if (this.gs && this.resourceId && this.allocationId) {
      this.gs.get<ConsumerOfResourceRes>(GRAPHQL_ENDPOINT, {
        params: {
          query: ` query {
             consumerOfResource(
               resourceId: "${this.resourceId}",
               allocationId: "${this.allocationId}")
          }`
        }
      })
      .pipe(map((res) => res.data.consumerOfResource))
      .subscribe((consumerId) => {
        this._consumerId = consumerId;
        this.consumerId.emit(consumerId);
      });
    }
  }
}
