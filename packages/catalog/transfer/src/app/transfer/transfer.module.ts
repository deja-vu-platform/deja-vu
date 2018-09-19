import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
  AddToBalanceComponent
} from './add-to-balance/add-to-balance.component';
import {
  CreateTransferComponent
} from './create-transfer/create-transfer.component';
import { InputMoneyComponent } from './input-money/input-money.component';
import { ShowBalanceComponent } from './show-balance/show-balance.component';
import { ShowTransferComponent } from './show-transfer/show-transfer.component';
import {
  ShowTransfersComponent
} from './show-transfers/show-transfers.component';

import { DvModule } from 'dv-core';

import { API_PATH } from './transfer.config';

const allComponents = [
  CreateTransferComponent, InputMoneyComponent, AddToBalanceComponent,
  ShowTransfersComponent, ShowTransferComponent, ShowBalanceComponent
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
