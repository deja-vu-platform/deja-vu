import {
  AfterViewInit,
  Component,
  ElementRef, EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action,
  ConfigService,
  GatewayService,
  GatewayServiceFactory,
  OnEval,
  RunService
} from '@deja-vu/core';
import { ShowAmountComponent } from '../show-amount/show-amount.component';
import { API_PATH } from '../transfer.config';

import { Amount } from '../shared/transfer.model';

import { TransferConfig } from '../transfer.config';


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
export class ShowBalanceComponent implements AfterViewInit, OnEval,
OnInit, OnChanges {
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
    private rs: RunService, @Inject(API_PATH) private apiPath,
    private cs: ConfigService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);

    this.balanceType = this.cs.getConfig<TransferConfig>(this.elem)
      .balanceType;
  }

  ngAfterViewInit() {
    this.loadBalance();
  }

  ngOnChanges() {
    this.loadBalance();
  }

  loadBalance() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const selection = this.balanceType === 'money' ? '' : 'id, count';
      this.gs.get<BalanceRes>(this.apiPath, {
        params: {
          inputs: {
            accountId: this.accountId
          },
          extraInfo: { returnFields: selection }
        }
      })
      .subscribe((res) => {
        this.balance = res.data.balance;
        this.fetchedBalance.emit(this.balance);
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && !this.balance && this.accountId);
  }
}
