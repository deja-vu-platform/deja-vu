import {
  Component, Input, ElementRef, Output, EventEmitter, OnChanges
} from '@angular/core';
import {
  AllocatorServiceFactory, AllocatorService
} from '../shared/allocator.service';


@Component({
  selector: 'allocator-show-consumer',
  template: '{{consumerObj.id}}',
})
export class ShowConsumerComponent implements OnChanges {
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Output() consumer = new EventEmitter();
  consumerObj = {id: ''};
  allocator: AllocatorService;

  constructor(elem: ElementRef, asf: AllocatorServiceFactory) {
    this.allocator = asf.for(elem);
  }

  ngOnChanges() {
    if (this.resourceId && this.allocationId) {
      this.allocator
        .consumerOfResource(this.resourceId, this.allocationId)
        .subscribe(consumer => {
          this.consumer.emit(consumer);
          this.consumerObj = consumer;
        });
    }
  }
}
