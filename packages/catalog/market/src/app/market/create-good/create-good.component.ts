import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Type } from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';

import { map } from 'rxjs/operators';

import { Good, Party, Market } from "../shared/market.model";

import { CreateGoodNameComponent } from '../create-good-name/create-good-name.component';
import { CreateGoodPriceComponent } from '../create-good-price/create-good-price.component';
import { CreateGoodSupplyComponent } from '../create-good-supply/create-good-supply.component';


@Component({
  selector: 'market-create-good',
  templateUrl: './create-good.component.html',
  styleUrls: ['./create-good.component.css'],
})
export class CreateGoodComponent implements OnInit, OnRun {
  @Input() id: string = ''; // optional
  @Input() name: string;
  @Input() price: number;
  @Input() supply: number;
  @Input() sellerId: string = ''; // optional, if not yet known
  @Input() marketId: string;

  @Output() createdId: EventEmitter<string> = new EventEmitter<string>();

  @Input() createGoodName: Action = {type: <Type<Component>> CreateGoodNameComponent};
  @Input() createGoodPrice: Action = {type: <Type<Component>> CreateGoodPriceComponent};
  @Input() createGoodSupply: Action = {type: <Type<Component>> CreateGoodSupplyComponent};

  // Presentation inputs
  @Input() buttonLabel: string = 'Create';

  gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  async dvOnRun() {
    console.log('creating good...');
    const res = await this.gs
      .post<{data: {createGood: Good}}>('/graphql', {
        query: `mutation {
          createGood (
            id: "${this.id}",
            name: "${this.name}",
            price: ${this.price},
            sellerId: "${this.sellerId}",
            supply: ${this.supply},
            marketId: "${this.marketId}") { id }
        }`
      })
      .pipe(map((res) => res.data.createGood))
      .subscribe((good: Good) => {
        this.createdId.emit(good.id);
      });
  }

  onSubmit() {
    if (!this.valid()) {
      console.log('invalid!');
      // TODO: show error message
      return;
    }
    this.rs.run(this.elem);
  }

  valid() {
    // sellerId is not required
    return this.name && CreateGoodComponent.isNumberValid(this.price)
      && CreateGoodComponent.isNumberValid(this.supply) && this.marketId;
  }

  private static isNumberValid(number: number) {
    return number || number === 0;
  }
}
