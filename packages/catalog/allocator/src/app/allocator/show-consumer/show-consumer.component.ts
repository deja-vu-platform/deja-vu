import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';

import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../allocator.config';

interface ConsumerOfResourceRes {
  data: { consumerOfResource: string };
}


@Component({
  selector: 'allocator-show-consumer',
  templateUrl: './show-consumer.component.html'
})
export class ShowConsumerComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Output() consumerId = new EventEmitter();
  _consumerId: string;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<ConsumerOfResourceRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              resourceId: this.resourceId,
              allocationId: this.allocationId
            }
          })
        }
      });
      const consumerId =  res.data.consumerOfResource;
      this._consumerId = consumerId;
      this.consumerId.emit(consumerId);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.resourceId && this.allocationId && this.dvs);
  }
}
