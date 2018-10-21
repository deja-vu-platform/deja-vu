import {
  Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';

import { Transfer } from '../shared/transfer.model';
import {
  ShowTransferComponent
} from '../show-transfer/show-transfer.component';
import { API_PATH, CONFIG } from '../transfer.config';


@Component({
  selector: 'transfer-show-transfers',
  templateUrl: './show-transfers.component.html',
  styleUrls: ['./show-transfers.component.css']
})
export class ShowTransfersComponent implements OnInit, OnChanges {
  // Fetch rules
  // If undefined then the fetched transfers are not filtered by that property
  @Input() fromId: string | undefined;
  @Input() toId: string | undefined;
  @Input() amount: any | undefined;

  // Show rules
  /* What fields of the transfer to show. These are passed as input
     to `showTransfer` */
  @Input() showId = true;
  @Input() showFromId = true;
  @Input() showToId = true;
  @Input() showAmount = true;

  @Input() showTransfer: Action = {
    type: <Type<Component>> ShowTransferComponent
  };
  @Input() noTransfersToShowText = 'No transfers to show';
  transfers: Transfer[] = [];

  balanceType: 'money' | 'items';

  showTransfers;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(CONFIG) config, @Inject(API_PATH) private apiPath) {
    this.showTransfers = this;
    this.balanceType = config.balanceType;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchTransfers();
  }

  ngOnChanges() {
    this.fetchTransfers();
  }

  fetchTransfers() {
    if (this.gs) {
      const selection = this.balanceType === 'money' ?
        '' : ' { id, count }';
      this.gs
        .get<{data: {transfers: Transfer[]}}>(this.apiPath, {
          params: {
            query: `
              query Transfers($input: TransfersInput!) {
                transfers(input: $input) {
                  ${this.showId ? 'id' : ''}
                  ${this.showFromId ? 'fromId' : ''}
                  ${this.showToId ? 'toId' : ''}
                  ${this.showAmount ? `amount ${selection}` : ''}
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                fromId: this.fromId,
                toId: this.toId,
                amount: this.amount
              }
            })
          }
        })
        .subscribe((res) => {
          this.transfers = res.data.transfers;
        });
    }
  }
}
