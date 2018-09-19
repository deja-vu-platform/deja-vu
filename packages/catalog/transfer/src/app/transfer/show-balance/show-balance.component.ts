import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnInit
} from '@angular/core';
import {GatewayService, GatewayServiceFactory} from 'dv-core';
import {API_PATH} from '../transfer.config';


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

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) {}

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
    this.gs.get<BalanceRes>(this.apiPath, {
      params: {
        query: `
          query {
           balance(accountId: "${this.accountId}")
          }
        `
      }
    })
    .subscribe((res) => {
      this.balance = res.data.balance;
    });
  }
}
