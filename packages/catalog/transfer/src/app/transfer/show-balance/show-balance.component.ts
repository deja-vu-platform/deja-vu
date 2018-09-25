import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnInit
} from '@angular/core';
import {GatewayService, GatewayServiceFactory} from 'dv-core';
import { API_PATH, CONFIG } from '../transfer.config';


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
  @Input() balance: any;

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
    });
  }
}
