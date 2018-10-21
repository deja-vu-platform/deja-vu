import {
  Component,
  ElementRef, EventEmitter,
  Inject,
  Input, OnChanges,
  OnInit,
  Output
} from '@angular/core';

import { GatewayService, GatewayServiceFactory } from 'dv-core';
import { Transfer } from '../shared/transfer.model';
import { API_PATH, CONFIG } from '../transfer.config';

import * as _ from 'lodash';


interface TransferRes {
  data: { transfer: Transfer };
  errors: { message: string }[];
}

@Component({
  selector: 'transfer-show-transfer',
  templateUrl: './show-transfer.component.html'
})
export class ShowTransferComponent implements OnInit, OnChanges {
  @Input() transfer: Transfer;
  @Input() id: string;

  @Input() showId = true;
  @Input() showFromId = true;
  @Input() showToId = true;
  @Input() showAmount = true;

  @Output() loadedTransfer = new EventEmitter<Transfer>();

  balanceType: 'money' | 'items';

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath, @Inject(CONFIG) config) {
    this.balanceType = config.balanceType;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadTransfer();
  }

  ngOnChanges() {
    this.loadTransfer();
  }

  loadTransfer() {
    // Only load transfer when id is given
    if (!this.gs || this.transfer || !this.id) {
      return;
    }
    const selection = this.balanceType === 'money' ?
      '' : ' { id, count }';
    this.gs.get<TransferRes>(this.apiPath, {
      params: {
        query: `
          query {
            transfer(id: "${this.id}") {
              ${this.showId ? 'id' : ''}
              ${this.showFromId ? 'fromId' : ''}
              ${this.showToId ? 'toId' : ''}
              ${this.showAmount ? `amount ${selection}` : ''}
            }
          }
        `
      }
    })
      .subscribe((res) => {
        if (res.errors) {
          throw new Error(_.map(res.errors, 'message')
            .join());
        }
        this.transfer = res.data.transfer;
        this.loadedTransfer.emit(this.transfer);
      });
  }
}
