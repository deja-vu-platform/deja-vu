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
import { BuyGoodButtonComponent } from './buy-good-button/buy-good-button.component';
import { BuyGoodFractionComponent } from './buy-good-fraction/buy-good-fraction.component';
import { BuyGoodQuantityComponent } from './buy-good-quantity/buy-good-quantity.component';
import { CancelCompoundTransactionButtonComponent } from './cancel-compound-transaction-button/cancel-compound-transaction-button.component';
import { CreateBalanceComponent } from './create-balance/create-balance.component';
import { CreateCompoundTransactionButtonComponent } from './create-compound-transaction-button/create-compound-transaction-button.component';
import { CreateGoodComponent } from './create-good/create-good.component';
import { CreateGoodNameComponent } from './create-good-name/create-good-name.component';
import { CreateGoodPriceComponent } from './create-good-price/create-good-price.component';
import { CreateGoodSupplyComponent } from './create-good-supply/create-good-supply.component';
import { CreateMarketComponent } from './create-market/create-market.component';
import { CreatePartyComponent } from './create-party/create-party.component';
import { EditCompoundTransactionSellerComponent } from './edit-compound-transaction-seller/edit-compound-transaction-seller.component';
import { CreateGoodSellerComponent } from './create-good-seller/create-good-seller.component';
import { PayForCompoundTransactionButtonComponent } from './pay-for-compound-transaction-button/pay-for-compound-transaction-button.component';
import { ShowAffordableGoodsComponent } from './show-affordable-goods/show-affordable-goods.component';
import { ShowAllGoodsComponent } from './show-all-goods/show-all-goods.component';
import { ShowAllTransactionsComponent } from './show-all-transactions/show-all-transactions.component';
import { ShowBalanceComponent } from './show-balance/show-balance.component';
import { ShowCompoundTransactionComponent } from './show-compound-transaction/show-compound-transaction.component';
import { ShowGoodComponent } from './show-good/show-good.component';
import { ShowMyGoodsForSaleComponent } from './show-my-goods-for-sale/show-my-goods-for-sale.component';
import { ShowMyPurchasesComponent } from './show-my-purchases/show-my-purchases.component';
import { ShowTransactionComponent } from './show-transaction/show-transaction.component';
import { ShowUnaffordableGoodsComponent } from './show-unaffordable-goods/show-unaffordable-goods.component';
import { StartCompoundTransactionButtonComponent } from './start-compound-transaction-button/start-compound-transaction-button.component';
import { UpdateGoodComponent } from './update-good/update-good.component';

const allComponenents = [
  AddAmountComponent, AddTransactionButtonComponent, BuyGoodButtonComponent,
  BuyGoodFractionComponent, BuyGoodQuantityComponent, CancelCompoundTransactionButtonComponent,
  CreateCompoundTransactionButtonComponent, CreateBalanceComponent, 
  CreateGoodComponent, CreateGoodNameComponent, CreateGoodPriceComponent,
  CreateGoodSellerComponent, CreateGoodSupplyComponent, CreateMarketComponent,
  CreatePartyComponent, EditCompoundTransactionSellerComponent,
  PayForCompoundTransactionButtonComponent, ShowAffordableGoodsComponent, ShowAllGoodsComponent,
  ShowAllTransactionsComponent, ShowBalanceComponent, ShowCompoundTransactionComponent,
  ShowGoodComponent, ShowMyGoodsForSaleComponent, ShowMyPurchasesComponent,
  ShowTransactionComponent, ShowUnaffordableGoodsComponent, StartCompoundTransactionButtonComponent,
  UpdateGoodComponent,
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
