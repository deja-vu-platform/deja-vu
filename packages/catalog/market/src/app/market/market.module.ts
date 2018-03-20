import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import { AddAmountComponent } from './add-amount/add-amount.component';
import {
  CancelCompoundTransactionComponent
} from './cancel-compound-transaction/cancel-compound-transaction.component';
import {
  CancelTransactionComponent
} from './cancel-transaction/cancel-transaction.component';
import {
  CreateBalanceComponent
} from './create-balance/create-balance.component';
import {
  CreateCompoundTransactionComponent
} from './create-compound-transaction/create-compound-transaction.component';
import { CreateGoodComponent } from './create-good/create-good.component';
import {
  CreateGoodNameComponent
} from './create-good-name/create-good-name.component';
import {
  CreateGoodPriceComponent
} from './create-good-price/create-good-price.component';
import {
  CreateGoodSupplyComponent
} from './create-good-supply/create-good-supply.component';
import { CreateMarketComponent } from './create-market/create-market.component';
import { CreatePartyComponent } from './create-party/create-party.component';
import {
  CreateTransactionComponent
} from './create-transaction/create-transaction.component';
import {
  CreateGoodSellerComponent
} from './create-good-seller/create-good-seller.component';
import {
  PayCompoundTransactionComponent
} from './pay-compound-transaction/pay-compound-transaction.component';
import {
  PayTransactionComponent
} from './pay-transaction/pay-transaction.component';
import {
  ShowCompoundTransactionComponent
} from './show-compound-transaction/show-compound-transaction.component';
import { ShowGoodComponent } from './show-good/show-good.component';
import { ShowGoodsComponent } from './show-goods/show-goods.component';
import { ShowPartyComponent } from './show-party/show-party.component';
import {
  ShowTransactionComponent
} from './show-transaction/show-transaction.component';
import {
  ShowTransactionsComponent
} from './show-transactions/show-transactions.component';
import { UpdateGoodComponent } from './update-good/update-good.component';

const allComponenents = [
  AddAmountComponent, CancelCompoundTransactionComponent,
  CancelTransactionComponent, CreateCompoundTransactionComponent,
  CreateBalanceComponent, CreateGoodComponent, CreateGoodNameComponent,
  CreateGoodPriceComponent, CreateGoodSellerComponent, CreateGoodSupplyComponent,
  CreateMarketComponent, CreatePartyComponent, CreateTransactionComponent,
  PayCompoundTransactionComponent, PayTransactionComponent,
  ShowCompoundTransactionComponent, ShowGoodComponent, ShowGoodsComponent,
  ShowPartyComponent, ShowTransactionComponent, ShowTransactionsComponent,
  UpdateGoodComponent
];

@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  declarations: allComponenents,
  entryComponents: allComponenents,
  exports: allComponenents
})
export class MarketModule { }
