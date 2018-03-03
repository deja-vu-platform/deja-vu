import {
  Component, Input, ElementRef, Output, EventEmitter, OnInit
} from '@angular/core';
import {
  AllocatorServiceFactory, AllocatorService
} from '../shared/allocator.service';
import { OnRun, RunService } from 'dv-core';


@Component({
  selector: 'allocator-create-resource',
  templateUrl: './create-resource.component.html'
})
export class CreateResourceComponent implements OnInit, OnRun {
  @Input() id: string;
  @Input() buttonLabel = 'Create Resource';
  @Input() inputLabel = 'Id';
  @Output() resource = new EventEmitter();
  allocator: AllocatorService;

  constructor(
    private elem: ElementRef,
    private asf: AllocatorServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.allocator = this.asf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  dvOnRun() {
    console.log(`Saving resource ${this.id}`);
    this.allocator
      .createResource(this.id)
      .subscribe(resource => {
        this.resource.emit({id: resource.id});
      });
  }
}
