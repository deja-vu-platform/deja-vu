import {
  Component, Input, ElementRef, Output, EventEmitter
} from '@angular/core';
import {
  AllocatorServiceFactory, AllocatorService
} from '../shared/allocator.service';

import * as _ from 'lodash';


@Component({
  selector: 'allocator-create-allocation',
  template: ''
})
export class CreateAllocationComponent {
  @Input() id: string;
  @Input() resources: [{id: string}];
  @Output() allocation = new EventEmitter();
  allocator: AllocatorService;

  constructor(elem: ElementRef, asf: AllocatorServiceFactory) {
    this.allocator = asf.for(elem);
  }

  run() {
    console.log(`Create allocation with ${this.id}`);
    const resourceIds = _.map(this.resources, 'id');
    this.allocator
      .createAllocation(this.id, resourceIds)
      .subscribe(allocation => {
        this.allocation.emit({id: allocation.id});
      });
  }
}
