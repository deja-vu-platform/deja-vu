import {
  Component, Input, ElementRef, Output, EventEmitter
} from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';

import { map } from 'rxjs/operators';

import * as _ from 'lodash';


interface CreateAllocationRes {
  data: {createAllocation: {id: string}};
}

@Component({
  selector: 'allocator-create-allocation',
  template: ''
})
export class CreateAllocationComponent {
  @Input() id: string;
  @Input() resources: [{id: string}];
  @Output() allocation = new EventEmitter();
  gs: GatewayService;

  constructor(elem: ElementRef, gsf: GatewayServiceFactory) {
    this.gs = gsf.for(elem);
  }

  run() {
    console.log(`Create allocation with ${this.id}`);
    const resourceIds = _.map(this.resources, 'id');
    this.gs
      .post<CreateAllocationRes>('/graphql', JSON.stringify({
        query: `mutation {
          createAllocation(
            id: "${this.id}", resourceIds: "${resourceIds}") {
            id
          }
        }`
      }))
      .pipe(map(res => res.data.createAllocation))
      .subscribe(allocation => {
        this.allocation.emit({id: allocation.id});
      });
  }
}
