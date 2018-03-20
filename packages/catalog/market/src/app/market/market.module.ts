import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import { AddAmountComponent } from './add-amount/add-amount.component';
import { AddTransactionButtonComponent } from './add-transaction-button/add-transaction-button.component';
import { CancelCompoundTransactionButtonComponent } from './cancel-compound-transaction-button/cancel-compound-transaction-button.component';
import { CancelTransactionComponent } from './cancel-transaction/cancel-transaction.component';
import { CreateBalanceComponent } from './create-balance/create-balance.component';
import { CreateCompoundTransactionComponent } from './create-compound-transaction/create-compound-transaction.component';
import { CreateGoodComponent } from './create-good/create-good.component';
import { CreateGoodNameComponent } from './create-good-name/create-good-name.component';
import { CreateGoodPriceComponent } from './create-good-price/create-good-price.component';
import { CreateGoodSupplyComponent } from './create-good-supply/create-good-supply.component';
import { CreateMarketComponent } from './create-market/create-market.component';
import { CreatePartyComponent } from './create-party/create-party.component';
import { CreateTransactionComponent } from './create-transaction/create-transaction.component';
import { EditCompoundTransactionSellerComponent } from './edit-compound-transaction-seller/edit-compound-transaction-seller.component';
import { CreateGoodSellerComponent } from './create-good-seller/create-good-seller.component';
import { PayForCompoundTransactionButtonComponent } from './pay-for-compound-transaction-button/pay-for-compound-transaction-button.component';
import { PayTransactionComponent } from './pay-transaction/pay-transaction.component';
import { ShowBalanceComponent } from './show-balance/show-balance.component';
import { ShowCompoundTransactionComponent } from './show-compound-transaction/show-compound-transaction.component';
import { ShowGoodComponent } from './show-good/show-good.component';
import { ShowGoodsComponent } from './show-goods/show-goods.component';
import { ShowTransactionComponent } from './show-transaction/show-transaction.component';
import { ShowTransactionsComponent } from './show-transactions/show-transactions.component';
import { StartCompoundTransactionButtonComponent } from './start-compound-transaction-button/start-compound-transaction-button.component';
import { UpdateGoodComponent } from './update-good/update-good.component';

const allComponenents = [
  AddAmountComponent, AddTransactionButtonComponent, 
  CancelCompoundTransactionButtonComponent, CancelTransactionComponent,
  CreateCompoundTransactionComponent, CreateBalanceComponent, 
  CreateGoodComponent, CreateGoodNameComponent, CreateGoodPriceComponent,
  CreateGoodSellerComponent, CreateGoodSupplyComponent, CreateMarketComponent,
  CreatePartyComponent, CreateTransactionComponent,
  EditCompoundTransactionSellerComponent, PayForCompoundTransactionButtonComponent,
  PayTransactionComponent,
  ShowBalanceComponent, ShowCompoundTransactionComponent, ShowGoodComponent,
  ShowGoodsComponent, ShowTransactionComponent, ShowTransactionsComponent,
  StartCompoundTransactionButtonComponent, UpdateGoodComponent,
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
