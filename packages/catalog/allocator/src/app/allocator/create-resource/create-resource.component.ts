import {
  Component, Input, ElementRef, Output, EventEmitter
} from '@angular/core';
import {
  AllocatorServiceFactory, AllocatorService
} from '../shared/allocator.service';


@Component({
  selector: 'allocator-create-resource',
  templateUrl: './create-resource.component.html'
})
export class CreateResourceComponent {
  @Input() id: string;
  @Output() resource = new EventEmitter();
  allocator: AllocatorService;

  constructor(elem: ElementRef, asf: AllocatorServiceFactory) {
    this.allocator = asf.for(elem);
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
