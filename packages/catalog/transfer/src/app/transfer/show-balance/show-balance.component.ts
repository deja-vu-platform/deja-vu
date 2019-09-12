import {
  AfterViewInit,
  Component,
  ElementRef, EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit, Output, Type
} from '@angular/core';
import {
  ComponentValue,
  ConfigServiceFactory,
  GatewayService,
  GatewayServiceFactory,
  OnEval,
  RunService
} from '@deja-vu/core';
import { ShowAmountComponent } from '../show-amount/show-amount.component';
import { API_PATH, TransferConfig } from '../transfer.config';

import { Amount } from '../shared/transfer.model';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import * as _ from 'lodash';
import { filter, take, takeUntil } from 'rxjs/operators';


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
export class ShowBalanceComponent implements
  AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  @Input() accountId: string;
  @Input() balance: Amount;

  @Input() showAmount: ComponentValue = {
    type: <Type<Component>> ShowAmountComponent
  };

  @Output() fetchedBalance = new EventEmitter<Amount>();

  showBalance = this;

  balanceType: 'money' | 'items';

  private gs: GatewayService;
  destroyed = new Subject<any>();
  refresh = false;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private csf: ConfigServiceFactory,
    private router: Router, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);

    this.balanceType = this.csf.createConfigService(this.elem)
      .getConfig().balanceType;
    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.destroyed))
      .subscribe(() => {
        this.refresh = true;
        this.load();
      });
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
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
        this.refresh = false;
        this.fetchedBalance.emit(this.balance);
      });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private canEval(): boolean {
    return this.gs &&
      (this.refresh || (!this.balance && !!this.accountId));
  }
}
