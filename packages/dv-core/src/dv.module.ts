import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TxComponent } from './tx.component';
import { IdComponent } from './id.component';
import { IdsComponent } from './ids.component';
import { ButtonComponent } from './button.component';
import { LinkComponent } from './link.component';
import { StatusComponent } from './status.component';
import { MergeComponent } from './merge.component';
import { IncludeComponent, IncludeDirective } from './include.component';
import { GatewayServiceFactory } from './gateway.service';
import { RunService } from './run.service';

import { OfDirective } from './of.directive';


const allComponents = [
  IdComponent, IdsComponent, TxComponent, IncludeComponent,
  IncludeDirective, ButtonComponent, LinkComponent, StatusComponent,
  MergeComponent
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: [...allComponents, OfDirective],
  providers: [ GatewayServiceFactory, RunService ],
  exports: [...allComponents, OfDirective]
})
export class DvModule { }
