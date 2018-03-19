import { Component, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'market-create-good-price',
  templateUrl: './create-good-price.component.html',
  styleUrls: ['./create-good-price.component.css'],
})
export class CreateGoodPriceComponent {
  @Output() price: EventEmitter<number> = new EventEmitter<number>();

  updatePrice(event) {
      this.price.emit(event.target.value);
  }
}
