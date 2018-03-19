import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output,
  ViewChild
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import {
  CompoundTransaction, Good, Party, Market
} from "../shared/market.model";


@Component({
  selector: 'market-buy-good-button',
  templateUrl: './buy-good-button.component.html',
  styleUrls: ['./buy-good-button.component.css'],
})
export class BuyGoodButtonComponent {
  @Input() id: string;
  @Input() buyerId: string;
  @Input() quantity: number;
  @Input() fraction: number;

  // constructor(private _graphQlService: GraphQlService) {}

  buyGood() {
  //   if (!this.good.atom_id || !this.buyer.atom_id) return;

  //   // default values for quantity and fraction
  //   if (!this.quantity.value && this.quantity.value !== 0) {
  //     this.quantity.value = 1;
  //   }
  //   if (!this.fraction.value && this.fraction.value !== 0) {
  //     this.fraction.value = 1;
  //   }

  //   this._graphQlService
  //     .post(`
  //       BuyGood(
  //         good_id: "${this.good.atom_id}",
  //         buyer_id: "${this.buyer.atom_id}",
  //         quantity: ${this.quantity.value},
  //         fraction: ${this.fraction.value}
  //       )
  //     `)
  //     .subscribe(_ => {
  //       this.quantity.value = undefined;
  //       this.fraction.value = undefined;
  //     });
  }

  valid() {
    return (this.id && this.buyerId);
  }
}
