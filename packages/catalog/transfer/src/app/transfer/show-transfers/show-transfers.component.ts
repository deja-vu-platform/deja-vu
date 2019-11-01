import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { Transfer } from '../shared/transfer.model';
import {
  ShowTransferComponent
} from '../show-transfer/show-transfer.component';
import { API_PATH } from '../transfer.config';


@Component({
  selector: 'transfer-show-transfers',
  templateUrl: './show-transfers.component.html',
  styleUrls: ['./show-transfers.component.css']
})
export class ShowTransfersComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  @Input() waitOn: string[];
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

  @Input() showTransfer: ComponentValue = {
    type: <Type<Component>> ShowTransferComponent
  };
  @Input() noTransfersToShowText = 'No transfers to show';
  transfers: Transfer[] = [];

  balanceType: 'money' | 'items';

  showTransfers;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showTransfers = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();

    this.balanceType = this.dvs.config
      .getConfig().balanceType;
  }

  ngAfterViewInit() {
    this.fetchTransfers();
  }

  ngOnChanges() {
    this.fetchTransfers();
  }

  fetchTransfers() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<{data: {transfers: Transfer[]}}>(
        this.apiPath,
        () => {
          const selection = this.balanceType === 'money' ?
            '' : ' { id, count }';

          return {
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
          };
        });
        this.transfers = res.data.transfers;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
