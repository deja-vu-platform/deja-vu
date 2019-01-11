import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

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
export class ShowTransfersComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  // Fetch rules
  // If undefined then the fetched transfers are not filtered by that property
  @Input() fromId: string | undefined;
  @Input() toId: string | undefined;

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
    private rs: RunService, @Inject(CONFIG) config,
    @Inject(API_PATH) private apiPath) {
    this.showTransfers = this;
    this.balanceType = config.balanceType;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.fetchTransfers();
  }

  ngOnChanges() {
    this.fetchTransfers();
  }

  fetchTransfers() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const selection = this.balanceType === 'money' ?
        '' : ' { id, count }';
      this.gs
        .get<{data: {transfers: Transfer[]}}>(this.apiPath, {
          params: {
            // When we are sending a potentially empty input object we need to
            // stringify the variables
            inputs: JSON.stringify({
              input: {
                fromId: this.fromId,
                toId: this.toId
              }
            }),
            extraInfo: {
              returnFields: `
                ${this.showId ? 'id' : ''}
                ${this.showFromId ? 'fromId' : ''}
                ${this.showToId ? 'toId' : ''}
                ${this.showAmount ? `amount ${selection}` : ''}
              `
            }
          }
        })
        .subscribe((res) => {
          this.transfers = res.data.transfers;
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
