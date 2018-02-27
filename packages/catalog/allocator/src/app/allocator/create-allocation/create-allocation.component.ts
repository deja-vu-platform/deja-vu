import {
  Component, Input, ElementRef, Output, EventEmitter, OnInit
} from '@angular/core';
import {
  AllocatorServiceFactory, AllocatorService
} from '../shared/allocator.service';

import * as _ from 'lodash';


@Component({
  selector: 'allocator-create-allocation',
  template: ''
})
export class CreateAllocationComponent implements OnInit {
  @Input() id: string;
  @Input() resources: [{id: string}];
  @Output() allocation = new EventEmitter();
  allocator: AllocatorService;

  constructor(
    private elem: ElementRef,
    private asf: AllocatorServiceFactory) {}

  ngOnInit() {
    this.allocator = this.asf.for(this.elem);
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
