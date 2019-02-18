import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output,
  SimpleChanges
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../allocator.config';


export interface CreateAllocationRes {
  data: { createAllocation: { id: string } };
}

@Component({
  selector: 'allocator-create-allocation',
  templateUrl: './create-allocation.component.html'
})
export class CreateAllocationComponent implements OnInit, OnChanges, OnExec {
  @Input() id: string | undefined;
  @Input() resourceIds: string[];
  @Input() consumerIds: string[];

  @Input() buttonLabel = 'Create Allocation';

  @Output() allocation = new EventEmitter();

  resourceIdsChange = new EventEmitter();
  consumerIdsChange = new EventEmitter();

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceIds) {
      this.resourceIdsChange.emit(null);
    }
    if (changes.consumerIds) {
      this.consumerIdsChange.emit(null);
    }
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    this.gs.willRequest();
    if (this.resourceIds === undefined) {
      console.log('Create allocation waiting for resourceIds');
      await this.resourceIdsChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    if (this.consumerIds === undefined) {
      console.log('Create allocation waiting for consumerIds');
      await this.consumerIdsChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    console.log(`Create allocation with ${this.id}`);

    return this.gs.post<CreateAllocationRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          resourceIds: this.resourceIds,
          consumerIds: this.consumerIds
        }
      },
      extraInfo: { returnFields: 'id' }
    })
      .toPromise()
      .then((res) => {
        this.allocation.emit({ id: res.data.createAllocation.id });

        return res;
      });
  }
}
