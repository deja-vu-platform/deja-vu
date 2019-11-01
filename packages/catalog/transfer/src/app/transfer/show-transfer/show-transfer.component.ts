import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';

import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
import { Transfer } from '../shared/transfer.model';
import { API_PATH } from '../transfer.config';

import * as _ from 'lodash';


interface TransferRes {
  data: { transfer: Transfer };
  errors: { message: string }[];
}

@Component({
  selector: 'transfer-show-transfer',
  templateUrl: './show-transfer.component.html'
})
export class ShowTransferComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  @Input() transfer: Transfer;
  @Input() id: string;

  @Input() showId = true;
  @Input() showFromId = true;
  @Input() showToId = true;
  @Input() showAmount = true;

  @Output() loadedTransfer = new EventEmitter<Transfer>();

  balanceType: 'money' | 'items';

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();

    this.balanceType = this.dvs.config
      .getConfig().balanceType;
  }

  ngAfterViewInit() {
    this.loadTransfer();
  }

  ngOnChanges() {
    this.loadTransfer();
  }

  loadTransfer() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const selection = this.balanceType === 'money' ?
        '' : ' { id, count }';
      const res = await this.dvs.get<TransferRes>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showFromId ? 'fromId' : ''}
              ${this.showToId ? 'toId' : ''}
              ${this.showAmount ? `amount ${selection}` : ''}
            `
          }
        }
      });
      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
      this.transfer = res.data.transfer;
      this.loadedTransfer.emit(this.transfer);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs && !this.transfer && this.id);
  }
}
