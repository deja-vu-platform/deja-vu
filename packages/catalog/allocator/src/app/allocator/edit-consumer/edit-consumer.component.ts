import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
   AllocatorService, AllocatorServiceFactory
} from '../shared/allocator.service';

import { OnRun, RunService } from 'dv-core';


@Component({
  selector: 'allocator-edit-consumer',
  templateUrl: './edit-consumer.component.html',
  styleUrls: ['./edit-consumer.component.css']
})
export class EditConsumerComponent implements OnChanges, OnInit, OnRun {
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Output() currentConsumer = new EventEmitter();
  selectedConsumerId: string;
  currentConsumerId: string;
  consumers = [];
  private allocator: AllocatorService;

  constructor(
    private elem: ElementRef, private asf: AllocatorServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.allocator = this.asf.for(this.elem);
    this.rs.register(this.elem, this);
    this.update();
  }

  ngOnChanges() {
    this.update();
  }

  update() {
    if (this.resourceId && this.allocationId) {
      this.allocator
        .consumerOfResource(this.resourceId, this.allocationId)
        .subscribe((consumer) => {
          this.currentConsumer.emit(consumer);
          this.selectedConsumerId = consumer.id;
          this.currentConsumerId = this.selectedConsumerId;
        });
      this.allocator
        .consumers(this.allocationId)
        .subscribe((consumers) => {
          this.consumers = consumers;
        });
    }
  }

  updateConsumer() {
    this.rs.run(this.elem);
  }

  dvOnRun() {
    if (this.currentConsumerId !== this.selectedConsumerId) {
      console.log(`Updating consumer to ${this.selectedConsumerId}`);
      this.allocator
        .editConsumerOfResource(
          this.resourceId, this.allocationId, this.selectedConsumerId)
        .subscribe((unused) => {});
    }
  }
}
