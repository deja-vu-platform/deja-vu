import {
  Component, Input, ElementRef, Output, EventEmitter, OnChanges, OnInit
} from '@angular/core';
import {
  AllocatorServiceFactory, AllocatorService
} from '../shared/allocator.service';


@Component({
  selector: 'allocator-edit-consumer',
  templateUrl: './edit-consumer.component.html',
  styleUrls: ['./edit-consumer.component.css']
})
export class EditConsumerComponent implements OnChanges, OnInit {
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Output() currentConsumer = new EventEmitter();
  selectedConsumerId: string;
  currentConsumerId: string;
  consumers = [];
  allocator: AllocatorService;

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
    if (this.resourceId && this.allocationId) {
      this.allocator
        .consumerOfResource(this.resourceId, this.allocationId)
        .subscribe(consumer => {
          this.currentConsumer.emit(consumer);
          this.selectedConsumerId = consumer.id;
          this.currentConsumerId = this.selectedConsumerId;
        });
      this.allocator
        .consumers(this.allocationId)
        .subscribe(consumers => {
          this.consumers = consumers;
        });
    }
  }

  run() {
    if (this.currentConsumerId !== this.selectedConsumerId) {
      console.log(`Updating consumer to ${this.selectedConsumerId}`);
      this.allocator
        .editConsumerOfResource(
          this.resourceId, this.allocationId, this.selectedConsumerId)
        .subscribe(unused => {});
    }
  }
}
