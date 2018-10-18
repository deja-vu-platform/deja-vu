import { Component, Input, OnInit } from '@angular/core';

import { ShowUserComponent } from 'authentication';

import { ShowClaimComponent } from '../show-claim/show-claim.component';
import { ShowSupplyComponent } from '../show-supply/show-supply.component';

@Component({
  selector: 'potluck-show-party',
  templateUrl: './show-party.component.html',
  styleUrls: ['./show-party.component.css']
})
export class ShowPartyComponent implements OnInit {
  @Input() partyId: string;
  @Input() loggedInUserId: string;
  showGuestUsername = ShowUserComponent;
  showSupply = ShowSupplyComponent;
  showClaim = ShowClaimComponent;
  viewMore: boolean;
  host: {id: string};
  balance;
  newGuest: { id: string };

  constructor() { }

  ngOnInit() {
  }
}
