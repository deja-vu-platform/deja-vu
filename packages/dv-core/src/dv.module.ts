import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClientModule } from '@angular/common/http';
import { TxComponent } from './tx.component';
import { IdComponent } from './id.component';
import { IdsComponent } from './ids.component';
import { InputIdComponent } from './input-id.component';
import { ButtonComponent } from './button.component';
import { ButtonLastComponent } from './button-last.component';
import { LinkComponent } from './link.component';
import { StatusComponent } from './status.component';
import { MergeComponent } from './merge.component';
import { IncludeComponent, IncludeDirective } from './include.component';
import { GatewayServiceFactory } from './gateway.service';
import { RunService } from './run.service';

import { OfDirective } from './of.directive';


const allComponents = [
  IdComponent, IdsComponent, TxComponent, IncludeComponent,
  IncludeDirective, ButtonLastComponent, ButtonComponent, LinkComponent,
  StatusComponent, MergeComponent,
  InputIdComponent
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatInputModule, MatFormFieldModule
  ],
  declarations: [...allComponents, OfDirective],
  providers: [ GatewayServiceFactory, RunService ],
  exports: [...allComponents, OfDirective]
})
export class DvModule { }
