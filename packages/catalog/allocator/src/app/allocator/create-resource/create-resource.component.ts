import { Component, Input } from '@angular/core';

@Component({
  selector: 'allocator-create-resource',
  templateUrl: './create-resource.component.html',
  styleUrls: ['./create-resource.component.css']
})
export class CreateResourceComponent {
  @Input() resourceId: string;
  @Input() allocationId: string;

  constructor() { }

  run() {
    console.log(
      `Saving resource ${this.resourceId} of allocation ${this.allocationId}`);
  }
}
