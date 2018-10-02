import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClientModule } from '@angular/common/http';
import { TxComponent } from './tx/tx.component';
import { IdComponent } from './id/id.component';
import { IdsComponent } from './ids/ids.component';
import { InputIdComponent } from './input-id/input-id.component';
import { StageComponent } from './stage/stage.component';
import { ButtonComponent } from './button/button.component';
import { ButtonLastComponent } from './button-last/button-last.component';
import { LinkComponent } from './link/link.component';
import { StatusComponent } from './status/status.component';
import { MergeComponent } from './merge/merge.component';
import { IncludeComponent, IncludeDirective } from './include/include.component';
import { GatewayServiceFactory } from './gateway.service';
import { RunService } from './run.service';

import { OfDirective } from './of.directive';


const allComponents = [
  IdComponent, IdsComponent, TxComponent, IncludeComponent,
  IncludeDirective, ButtonLastComponent, ButtonComponent, LinkComponent,
  StatusComponent, MergeComponent,
  InputIdComponent, StageComponent
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
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
