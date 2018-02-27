import {
  Component, Input, ElementRef, Output, EventEmitter, OnInit
} from '@angular/core';
import {
  AllocatorServiceFactory, AllocatorService
} from '../shared/allocator.service';


@Component({
  selector: 'allocator-create-resource',
  templateUrl: './create-resource.component.html'
})
export class CreateResourceComponent implements OnInit {
  @Input() id: string;
  @Output() resource = new EventEmitter();
  allocator: AllocatorService;

  constructor(
    private elem: ElementRef,
    private asf: AllocatorServiceFactory) {}

  ngOnInit() {
    this.allocator = this.asf.for(this.elem);
  }

  run() {
    console.log(`Saving resource ${this.id}`);
    this.allocator
      .createResource(this.id)
      .subscribe(resource => {
        this.resource.emit({id: resource.id});
      });
  }
}
