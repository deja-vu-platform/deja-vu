import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges
} from '@angular/core';
import {
   AllocatorService, AllocatorServiceFactory
} from '../shared/allocator.service';

import { OnRun, RunService } from 'dv-core';


@Component({
  selector: 'allocator-delete-resource',
  templateUrl: './delete-resource.component.html',
  styleUrls: ['./delete-resource.component.css']
})
export class DeleteResourceComponent implements OnInit, OnChanges {
  @Input() id: string;
  idChange = new EventEmitter();

  private allocator: AllocatorService;

  constructor(
    private elem: ElementRef,
    private asf: AllocatorServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.allocator = this.asf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.id) {
      this.idChange.emit();
    }
  }

  async dvOnRun(): Promise<any> {
    if (this.id === undefined) {
      await this.idChange.asObservable()
        .toPromise();
    }
    console.log(`Delete resource with ${this.id}`);

    return this.allocator
      .deleteResource(this.id)
      .toPromise();
  }
}
