import { Component, Input, Type } from '@angular/core';

import { CreateItemCountComponent } from 'transfer';

@Component({
  selector: 'potluck-claim-supply',
  templateUrl: './claim-supply.component.html',
  styleUrls: ['./claim-supply.component.css']
})
export class ClaimSupplyComponent {
  @Input() supply: any;
  @Input() loggedInUserId: string;
  @Input() partyId: string;

  transferCreateItemCount = <Type<Component>> CreateItemCountComponent;
}
