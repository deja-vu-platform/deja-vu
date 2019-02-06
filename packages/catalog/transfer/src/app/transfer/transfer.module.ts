import { CommonModule } from '@angular/common';
import { InjectionToken, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
  AddToBalanceComponent
} from './add-to-balance/add-to-balance.component';
export { AddToBalanceComponent };
import {
  CreateItemCountComponent
} from './create-item-count/create-item-count.component';
export { CreateItemCountComponent };
import {
  CreateTransferComponent
} from './create-transfer/create-transfer.component';
export { CreateTransferComponent };
import { InputAmountComponent } from './input-amount/input-amount.component';
export { InputAmountComponent };
import {
  InputItemCountsComponent
} from './input-item-counts/input-item-counts.component';
export { InputItemCountsComponent };
import { InputMoneyComponent } from './input-money/input-money.component';
export { InputMoneyComponent };
import { ShowAmountComponent } from './show-amount/show-amount.component';
export { ShowAmountComponent };
import { ShowBalanceComponent } from './show-balance/show-balance.component';
export { ShowBalanceComponent };
import {
  ShowItemCountComponent
} from './show-item-count/show-item-count.component';
export { ShowItemCountComponent };
import {
  ShowItemCountsComponent
} from './show-item-counts/show-item-counts.component';
export { ShowItemCountsComponent };
import { ShowTransferComponent } from './show-transfer/show-transfer.component';
export { ShowTransferComponent };
import {
  ShowTransfersComponent
} from './show-transfers/show-transfers.component';
export { ShowTransfersComponent };

import { DvModule } from '@dejavu-lang/core';

import { API_PATH, CONFIG, TransferConfig } from './transfer.config';

const allComponents = [
  CreateTransferComponent, InputMoneyComponent, AddToBalanceComponent,
  ShowTransfersComponent, ShowTransferComponent, ShowBalanceComponent,
  InputAmountComponent, InputItemCountsComponent, CreateItemCountComponent,
  ShowItemCountComponent, ShowItemCountsComponent, ShowAmountComponent
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
  providers: [ { provide: API_PATH, useValue: '/graphql' } ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class TransferModule { }

export const TRANSFER_CONFIG: InjectionToken<TransferConfig> = CONFIG;
