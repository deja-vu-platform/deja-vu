import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'allocator-create-allocation',
  templateUrl: './create-allocation.component.html',
  styleUrls: ['./create-allocation.component.css']
})
export class CreateAllocationComponent {
  @Input() id: string;

  constructor() { }

  run() {
    console.log(`Create allocation with ${this.id}`);
  }
}
