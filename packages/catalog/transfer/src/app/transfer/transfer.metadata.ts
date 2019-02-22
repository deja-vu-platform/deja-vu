import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
  AddToBalanceComponent
} from './add-to-balance/add-to-balance.component';
import {
  CreateItemCountComponent
} from './create-item-count/create-item-count.component';
import {
  CreateTransferComponent
} from './create-transfer/create-transfer.component';
import { InputAmountComponent } from './input-amount/input-amount.component';
import {
  InputItemCountsComponent
} from './input-item-counts/input-item-counts.component';
import { InputMoneyComponent } from './input-money/input-money.component';
import { ShowAmountComponent } from './show-amount/show-amount.component';
import { ShowBalanceComponent } from './show-balance/show-balance.component';
import {
  ShowItemCountComponent
} from './show-item-count/show-item-count.component';
import {
  ShowItemCountsComponent
} from './show-item-counts/show-item-counts.component';
import { ShowTransferComponent } from './show-transfer/show-transfer.component';
import {
  ShowTransfersComponent
} from './show-transfers/show-transfers.component';

import { DvModule } from '@deja-vu/core';

const allComponents = [
  CreateTransferComponent, InputMoneyComponent, AddToBalanceComponent,
  ShowTransfersComponent, ShowTransferComponent, ShowBalanceComponent,
  InputAmountComponent, InputItemCountsComponent, CreateItemCountComponent,
  ShowItemCountComponent, ShowItemCountsComponent, ShowAmountComponent
];

const metadata = {
  imports: [
    CommonModule,
    DvModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};
export { metadata };
