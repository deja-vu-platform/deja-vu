import { Component, Input } from '@angular/core';

import { Transfer } from '../shared/transfer.model';

@Component({
  selector: 'transfer-show-transfer',
  templateUrl: './show-transfer.component.html'
})
export class ShowTransferComponent {
  @Input() transfer: Transfer;

  @Input() showId = true;
  @Input() showFromId = true;
  @Input() showToId = true;
  @Input() showAmount = true;
}
