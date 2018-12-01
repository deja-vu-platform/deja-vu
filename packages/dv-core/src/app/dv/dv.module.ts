import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClientModule } from '@angular/common/http';
import { ButtonLastComponent } from './button-last/button-last.component';
import { ButtonComponent } from './button/button.component';
import { CallbackLinkComponent } from './callback-link/callback-link.component';
import { CallbackComponent } from './callback/callback.component';
import { ChooseComponent } from './choose/choose.component';
import { GatewayServiceFactory } from './gateway.service';
import { IdComponent } from './id/id.component';
import { IdsComponent } from './ids/ids.component';
import { IfComponent } from './if/if.component';
import { IncludeComponent, IncludeDirective } from './include/include.component';
import { InputIdComponent } from './input-id/input-id.component';
import { LinkComponent } from './link/link.component';
import { MergeComponent } from './merge/merge.component';
import { RedirectComponent } from './redirect/redirect.component';
import { RunService } from './run.service';
import { StageComponent } from './stage/stage.component';
import { StatusComponent } from './status/status.component';
import { TxComponent } from './tx/tx.component';

import { OfDirective } from './of.directive';


const allComponents = [
  IdComponent, IdsComponent, TxComponent, IncludeComponent, IfComponent,
  IncludeDirective, ButtonLastComponent, ButtonComponent, LinkComponent,
  StatusComponent, MergeComponent, InputIdComponent, StageComponent,
  ChooseComponent, CallbackComponent, CallbackLinkComponent,
  RedirectComponent
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule
  ],
  declarations: [...allComponents, OfDirective],
  providers: [ GatewayServiceFactory, RunService ],
  exports: [...allComponents, OfDirective]
})
export class DvModule { }
