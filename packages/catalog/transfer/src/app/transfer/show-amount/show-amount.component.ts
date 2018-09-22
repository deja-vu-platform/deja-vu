import {
  Component,
  Inject,
  Input} from '@angular/core';

import { CONFIG } from '../transfer.config';

@Component({
  selector: 'transfer-show-amount',
  templateUrl: './show-amount.component.html',
  styleUrls: ['./show-amount.component.css']
})
export class ShowAmountComponent {
  @Input() amount: any;

  balanceType: 'money' | 'items';

  constructor(@Inject(CONFIG) config) {
    this.balanceType = config.balanceType;
  }
}
