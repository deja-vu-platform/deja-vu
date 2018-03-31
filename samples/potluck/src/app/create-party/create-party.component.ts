import { Component } from '@angular/core';

import { ShowUserComponent } from 'authentication';

import { CreateSupplyComponent } from '../create-supply/create-supply.component';
import { ShowSupplyComponent } from '../show-supply/show-supply.component';

@Component({
  selector: 'potluck-create-party',
  templateUrl: './create-party.component.html',
  styleUrls: ['./create-party.component.css']
})
export class CreatePartyComponent {
  showGuestUsername = ShowUserComponent;
  createSupply = CreateSupplyComponent;
  showSupply = ShowSupplyComponent;
}
