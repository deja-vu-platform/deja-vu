import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'potluck-create-supply',
  templateUrl: './create-supply.component.html',
  styleUrls: ['./create-supply.component.css']
})
export class CreateSupplyComponent  {
  @Input() save = true;
  @Input() loggedInUserId: string;
  @Input() partyId: string | undefined;
  @Output() supply = new EventEmitter();
  supplyId: string;
  object: any;
  itemCount: any;
  item: string;
  unit: string;

  outputAsSupply(value) {
    this.supply.emit(value);
  }
}
