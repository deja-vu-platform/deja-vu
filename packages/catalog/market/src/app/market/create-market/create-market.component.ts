import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';


import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import { Good, Market } from '../shared/market.model';

import * as _ from 'lodash';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-create-market',
  templateUrl: './create-market.component.html',
  styleUrls: ['./create-market.component.css']
})
export class CreateMarketComponent
implements OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string | undefined = '';
  @Input() showOptionToInputId = true;
  @Input() showOptionToInputGoods = true;
  @Input() showOptionToSubmit = true;
  @Output() market: EventEmitter<Market> = new EventEmitter<Market>();

  // Presentation inputs
  @Input() buttonLabel = 'Create Market';
  @Input() inputLabel = 'Id';
  @Input() newMarketSavedText = 'New market saved';

  idControl = new FormControl('');
  goodsControl = new FormControl();
  createMarketForm = this.builder.group({
    idControl: this.idControl,
    goodsControl: this.goodsControl
  });

  newMarketSaved = false;
  newMarketError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs
      .post<{data: {createMarket: {id: string}}, errors: {message: string}[]}>(
        '/graphql', {
          query: `mutation CreateMarket($input: CreateMarketInput!) {
            createMarket(input: $input) {
              id
            }
          }`,
          variables: {
            input: {
              id: this.showOptionToInputId ? this.idControl.value : this.id,
              withNewGoods: this.showOptionToInputGoods ?
                _.map(this.goodsControl.value, this.goodToCreateGoodInput)
                : undefined
            }
          }
        })
        .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
    this.market.emit({ id: res.data.createMarket.id });
  }

  dvOnAfterCommit() {
    this.newMarketSaved = true;
    this.newMarketError = '';
    window.setTimeout(() => {
      this.newMarketSaved = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.newMarketError = reason.message;
  }

  private goodToCreateGoodInput(g: Good) {
    const goodInput = _.omit(g, 'seller');
    goodInput.sellerId = g.seller.id;

    return goodInput;
  }
}
