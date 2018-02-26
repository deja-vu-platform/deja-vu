import {
  Component, Input, ElementRef, Output, EventEmitter, OnChanges
} from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';

import { map } from 'rxjs/operators';


interface ConsumerOfResourceRes {
  data: {consumerOfResource: {id: string}};
}

@Component({
  selector: 'allocator-show-consumer',
  template: '{{consumerObj.id}}',
})
export class ShowConsumerComponent implements OnChanges {
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Output() consumer = new EventEmitter();
  consumerObj = {id: ''};
  gs: GatewayService;

  constructor(elem: ElementRef, gsf: GatewayServiceFactory) {
    this.gs = gsf.for(elem);
  }

  ngOnChanges() {
    if (this.resourceId && this.allocationId) {
      this.gs
        .get<ConsumerOfResourceRes>('/graphql', {
          params: {
            query: `
              query {
                consumerOfResource(
                  resourceId: "${this.resourceId}",
                  allocationId: "${this.allocationId}") {
                    id
                }
              }
            `
          }
        })
        .pipe(map(res => res.data.consumerOfResource))
        .subscribe(consumer => {
          this.consumer.emit(consumer);
          this.consumerObj = consumer;
        });
    }
  }
}
