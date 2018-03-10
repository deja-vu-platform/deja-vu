import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddAmountComponent } from './add-amount/add-amount.component';
import { AddTransactionButtonComponent } from './add-transaction-button/add-transaction-button.component';
import { BuyGoodButtonComponent } from './buy-good-button/buy-good-button.component';
import { BuyGoodFractionComponent } from './buy-good-fraction/buy-good-fraction.component';
import { BuyGoodQuantityComponent } from './buy-good-quantity/buy-good-quantity.component';
import { CancelCompoundTransactionButtonComponent } from './cancel-compound-transaction-button/cancel-compound-transaction-button.component';
import { CreateCompoundTransactionButtonComponent } from './create-compound-transaction-button/create-compound-transaction-button.component';
import { CreateGoodButtonComponent } from './create-good-button/create-good-button.component';
import { CreateGoodNameComponent } from './create-good-name/create-good-name.component';
import { CreateGoodPriceComponent } from './create-good-price/create-good-price.component';
import { CreateGoodSupplyComponent } from './create-good-supply/create-good-supply.component';
import { EditCompoundTransactionSellerComponent } from './edit-compound-transaction-seller/edit-compound-transaction-seller.component';
import { EditGoodNameComponent } from './edit-good-name/edit-good-name.component';
import { EditGoodSellerComponent } from './edit-good-seller/edit-good-seller.component';
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

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [AddAmountComponent, AddTransactionButtonComponent, BuyGoodButtonComponent, BuyGoodFractionComponent, BuyGoodQuantityComponent, CancelCompoundTransactionButtonComponent, CreateCompoundTransactionButtonComponent, CreateGoodButtonComponent, CreateGoodNameComponent, CreateGoodPriceComponent, CreateGoodSupplyComponent, EditCompoundTransactionSellerComponent, EditGoodNameComponent, EditGoodSellerComponent, PayForCompoundTransactionButtonComponent, ShowAffordableGoodsComponent, ShowAllGoodsComponent, ShowAllTransactionsComponent, ShowBalanceComponent, ShowCompoundTransactionComponent, ShowGoodComponent, ShowMyGoodsForSaleComponent, ShowMyPurchasesComponent, ShowTransactionComponent, ShowUnaffordableGoodsComponent, StartCompoundTransactionButtonComponent]
})
export class MarketModule { }
