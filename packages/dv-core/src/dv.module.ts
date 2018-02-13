import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { HttpClientModule } from '@angular/common/http'; 
import { TxComponent } from './tx.component';
import { IdComponent } from './id.component';
import { IncludeComponent, IncludeDirective } from './include.component';
import { GatewayServiceFactory } from './gateway.service';


@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: [IdComponent, TxComponent, IncludeComponent, IncludeDirective],
  providers: [ GatewayServiceFactory ],
  exports: [IdComponent, TxComponent, IncludeComponent, IncludeDirective]
})
export class DvModule { }
