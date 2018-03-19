import { Component, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'market-create-good-supply',
  templateUrl: './create-good-supply.component.html',
  styleUrls: ['./create-good-supply.component.css'],
})
export class CreateGoodSupplyComponent {
  @Output() supply: EventEmitter<number> = new EventEmitter<number>();

  updateSupply(event) {
      this.supply.emit(event.target.value);
  }
}
