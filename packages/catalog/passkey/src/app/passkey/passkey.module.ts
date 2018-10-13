import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';
import { PasskeyService } from './shared/passkey.service';

import { API_PATH } from './passkey.config';

import {
  CreatePasskeyComponent
} from './create-passkey/create-passkey.component';

const allComponents = [
  CreatePasskeyComponent
];

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  providers: [PasskeyService, { provide: API_PATH, useValue: '/graphql' }],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class PasskeyModule { }
