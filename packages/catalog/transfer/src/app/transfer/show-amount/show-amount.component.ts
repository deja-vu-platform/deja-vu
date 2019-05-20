import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';

import { ConfigServiceFactory } from '@deja-vu/core';


@Component({
  selector: 'transfer-show-amount',
  templateUrl: './show-amount.component.html',
  styleUrls: ['./show-amount.component.css']
})
export class ShowAmountComponent implements OnInit {
  @Input() amount: any;

  balanceType: 'money' | 'items';

  constructor(
    private elem: ElementRef, private csf: ConfigServiceFactory) { }

  ngOnInit() {
    this.balanceType = this.csf.createConfigService(this.elem)
      .getConfig().balanceType;
  }
}
