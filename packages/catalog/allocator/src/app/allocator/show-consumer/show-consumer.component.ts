import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
   AllocatorService, AllocatorServiceFactory
} from '../shared/allocator.service';


@Component({
  selector: 'allocator-show-consumer',
  template: '{{consumerObj.id}}'
})
export class ShowConsumerComponent implements OnChanges, OnInit {
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Output() consumer = new EventEmitter();
  consumerObj = {id: ''};
  private allocator: AllocatorService;

  constructor(
    private elem: ElementRef,
    private asf: AllocatorServiceFactory) {}

  ngOnInit() {
    this.allocator = this.asf.for(this.elem);
    this.update();
  }

  ngOnChanges() {
    this.update();
  }

  update() {
    if (this.allocator && this.resourceId && this.allocationId) {
      this.allocator
        .consumerOfResource(this.resourceId, this.allocationId)
        .subscribe((consumer) => {
          this.consumer.emit(consumer);
          this.consumerObj = consumer;
        });
    }
  }
}
