import {
  AfterViewInit,
  Component,
  ElementRef, EventEmitter,
  Inject,
  Input, OnChanges,
  OnInit,
  Output
} from '@angular/core';

import {
  GatewayService,
  GatewayServiceFactory,
  OnEval,
  RunService
} from '@dejavu-lang/core';
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
export class ShowTransferComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
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
    private rs: RunService, @Inject(API_PATH) private apiPath,
    @Inject(CONFIG) config) {
    this.balanceType = config.balanceType;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.loadTransfer();
  }

  ngOnChanges() {
    this.loadTransfer();
  }

  loadTransfer() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const selection = this.balanceType === 'money' ?
        '' : ' { id, count }';
      this.gs.get<TransferRes>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
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
        if (res.errors) {
          throw new Error(_.map(res.errors, 'message')
            .join());
        }
        this.transfer = res.data.transfer;
        this.loadedTransfer.emit(this.transfer);
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && !this.transfer && this.id);
  }
}
