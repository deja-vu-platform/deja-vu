import {
  Component,
  ElementRef, EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import { ShowAmountComponent } from '../show-amount/show-amount.component';
import { API_PATH, CONFIG } from '../transfer.config';

import { Amount } from '../shared/transfer.model';


interface BalanceRes {
  data: { balance: any };
  errors: { message: string }[];
}

@Component({
  selector: 'transfer-show-balance',
  templateUrl: './show-balance.component.html',
  styleUrls: ['./show-balance.component.css']
})
export class ShowBalanceComponent implements OnInit, OnChanges {
  @Input() accountId: string;
  @Input() balance: Amount;

  @Input() showAmount: Action = {
    type: <Type<Component>> ShowAmountComponent
  };

  @Output() fetchedBalance = new EventEmitter<Amount>();

  showBalance = this;

  balanceType: 'money' | 'items';

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath, @Inject(CONFIG) config) {
    this.balanceType = config.balanceType;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadBalance();
  }

  ngOnChanges() {
    this.loadBalance();
  }

  loadBalance() {
    if (!this.gs || this.balance || !this.accountId) {
      return;
    }
    const selection = this.balanceType === 'money' ? '' : ' { itemId, count }';
    this.gs.get<BalanceRes>(this.apiPath, {
      params: {
        query: `
          query {
           balance(accountId: "${this.accountId}") ${selection}
          }
        `
      }
    })
    .subscribe((res) => {
      this.balance = res.data.balance;
      this.fetchedBalance.emit(this.balance);
    });
  }
}
