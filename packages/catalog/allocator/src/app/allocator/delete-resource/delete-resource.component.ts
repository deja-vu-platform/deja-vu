import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  SimpleChanges
} from '@angular/core';

import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../allocator.config';


interface DeleteResourceRes {
  data: {deleteResource: boolean};
}

@Component({
  selector: 'allocator-delete-resource',
  templateUrl: './delete-resource.component.html',
  styleUrls: ['./delete-resource.component.css']
})
export class DeleteResourceComponent implements OnInit, OnChanges, OnExec {
  @Input() waitOn: string[];
  @Input() resourceId: string;
  @Input() allocationId: string;
  resourceIdChange = new EventEmitter();
  allocationIdChange = new EventEmitter();

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs) {
      this.dvs.waiter.processChanges(changes);
    }
  }

  async dvOnExec(): Promise<any> {
    await this.dvs.waitAndPost<DeleteResourceRes>(this.apiPath, () => ({
      inputs: {
        input: {
          resourceId: this.resourceId,
          allocationId: this.allocationId
        }
      }
    }));
  }
}
