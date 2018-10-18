import { Component } from '@angular/core';

import { ChooseUserComponent, ShowUserComponent } from 'authentication';

import { CreateSupplyComponent } from '../create-supply/create-supply.component';
import { ShowSupplyComponent } from '../show-supply/show-supply.component';

import {
  GuestListHeaderComponent
} from '../guest-list-header/guest-list-header.component';

import { SupplyListHeaderComponent } from '../supply-list-header/supply-list-header.component';


@Component({
  selector: 'potluck-create-party',
  templateUrl: './create-party.component.html',
  styleUrls: ['./create-party.component.css']
})
export class CreatePartyComponent {
  showGuestUsername = ShowUserComponent;
  createSupply = CreateSupplyComponent;
  showSupply = ShowSupplyComponent;
  guestListHeader = GuestListHeaderComponent;
  supplyListHeader = SupplyListHeaderComponent;
  chooseUser = ChooseUserComponent;
  stagedMembers: any[];
  stagedSupplies: any[];
  partyId: string;
  user;
}
