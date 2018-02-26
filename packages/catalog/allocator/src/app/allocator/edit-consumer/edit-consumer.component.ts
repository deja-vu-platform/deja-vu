import {
  Component, Input, ElementRef, Output, EventEmitter, OnChanges
} from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';

import { map } from 'rxjs/operators';

interface ConsumerOfResourceRes {
  data: {consumerOfResource: {id: string}};
}

interface AllocationRes {
  data: {allocation: {consumers: {id: string}[]}};
}

@Component({
  selector: 'allocator-edit-consumer',
  templateUrl: './edit-consumer.component.html',
  styleUrls: ['./edit-consumer.component.css']
})
export class EditConsumerComponent implements OnChanges {
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Output() currentConsumer = new EventEmitter();
  selectedConsumerId: string;
  currentConsumerId: string;
  consumers = [];
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
          this.currentConsumer.emit(consumer);
          this.selectedConsumerId = consumer.id;
          this.currentConsumerId = this.selectedConsumerId;
        });
      this.gs
        .get<AllocationRes>('/graphql', {
          params: {
            query: `
              query {
                allocation(id: "${this.allocationId}") {
                  consumers {
                    id
                  }
                }
              }
            `
          }
        })
        .pipe(map(res => res.data.allocation.consumers))
        .subscribe(consumers => {
          this.consumers = consumers;
        });
    }
  }

  run() {
    if (this.currentConsumerId !== this.selectedConsumerId) {
      console.log(`Updating consumer to ${this.selectedConsumerId}`);
      this.gs
        .post('/graphql', JSON.stringify({
          query: `mutation {
            editConsumerOfResource(
              resourceId: "${this.resourceId}",
              allocationId: "${this.allocationId}",
              newConsumerId: "${this.selectedConsumerId}")
          }`
        }))
        .subscribe(unused => {});
    }
  }

}
