import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';

import { ConfigService } from '@deja-vu/core';

import { TransferConfig } from '../transfer.config';


@Component({
  selector: 'transfer-show-amount',
  templateUrl: './show-amount.component.html',
  styleUrls: ['./show-amount.component.css']
})
export class ShowAmountComponent implements OnInit {
  @Input() amount: any;

  balanceType: 'money' | 'items';

  constructor(
    private elem: ElementRef, private cs: ConfigService) { }

  ngOnInit() {
    this.balanceType = this.cs.getConfig<TransferConfig>(this.elem)
      .balanceType;
  }
}
