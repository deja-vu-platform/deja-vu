import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnDestroy, OnInit, Output, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';
import { ShowAmountComponent } from '../show-amount/show-amount.component';
import { API_PATH, TransferConfig } from '../transfer.config';

import { Amount } from '../shared/transfer.model';

import * as _ from 'lodash';


interface BalanceRes {
  data: { balance: any };
  errors: { message: string }[];
}

@Component({
  selector: 'transfer-show-balance',
  templateUrl: './show-balance.component.html',
  styleUrls: ['./show-balance.component.css'],
  entryComponents: [ ShowAmountComponent ]
})
export class ShowBalanceComponent
  implements AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  @Input() waitOn: string[];
  @Input() accountId: string;
  @Input() balance: Amount;

  @Input() showAmount: ComponentValue = {
    type: <Type<Component>> ShowAmountComponent
  };

  @Output() fetchedBalance = new EventEmitter<Amount>();

  showBalance = this;

  balanceType: 'money' | 'items';

  private dvs: DvService;
  refresh = false;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => {
        this.refresh = true;
        this.load();
      })
      .build();

    this.balanceType = this.dvs.config
      .getConfig().balanceType;
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
      const res = await this.dvs.waitAndGet<BalanceRes>(this.apiPath, () => {
        const selection = this.balanceType === 'money' ? '' : 'id, count';

        return {
          params: {
            inputs: {
              accountId: this.accountId
            },
            extraInfo: { returnFields: selection }
          }
        };
      });
      this.balance = res.data.balance;
      this.refresh = false;
      this.fetchedBalance.emit(this.balance);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return this.dvs &&
      (this.refresh || (!this.balance && !!this.accountId));
  }
}
