import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { HttpClientModule } from '@angular/common/http'; 
import { TxComponent } from './tx.component';
import { IdComponent } from './id.component';
import { ButtonComponent } from './button.component';
import { LinkComponent } from './link.component';
import { IncludeComponent, IncludeDirective } from './include.component';
import { GatewayServiceFactory } from './gateway.service';
import { RunService } from './run.service';


const allComponents = [
  IdComponent, TxComponent, IncludeComponent, IncludeDirective,
  ButtonComponent, LinkComponent
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: allComponents,
  providers: [ GatewayServiceFactory, RunService ],
  exports: allComponents
})
export class DvModule { }
