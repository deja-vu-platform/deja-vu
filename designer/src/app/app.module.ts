import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DragulaModule } from 'ng2-dragula';
import { NgxElectronModule } from 'ngx-electron';
import { QuillModule } from 'ngx-quill';

import { DvModule, GATEWAY_URL, USED_CLICHES_CONFIG } from '@deja-vu/core';

import { AppRoutingModule } from './app-routing.module';
import { ClicheModule, dvCoreActions } from './cliche.module';
import { MatModule } from './mat.module';

import { DynamicComponentDirective } from './dynamic-component.directive';

import {
  ActionDefinitionComponent
} from './action-definition/action-definition.component';
import {
  ActionInstanceComponent
} from './action-instance/action-instance.component';
import {
  AddAppActionIoComponent
} from './add-app-action-io/add-app-action-io.component';
import { AppComponent } from './app.component';
import {
  ConfigureActionComponent
} from './configure-action/configure-action.component';
import {
  ConfigureClicheComponent, usedClichesConfig
} from './configure-cliche/configure-cliche.component';
import { DesignerComponent } from './designer/designer.component';
import { FloatingMenuComponent } from './floating-menu/floating-menu.component';
import {
  SetInputsComponent
} from './set-inputs/set-inputs.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { TextComponent } from './text/text.component';
import { TopBarComponent } from './top-bar/top-bar.component';

import { ChildScopeIO } from './io';

export function getUsedClichesConfig() {
  return usedClichesConfig;
}

ChildScopeIO.actionInstanceComponent = ActionInstanceComponent;

@NgModule({
  declarations: [
    DynamicComponentDirective,
    ActionDefinitionComponent,
    ActionInstanceComponent,
    AppComponent,
    ConfigureActionComponent,
    ConfigureClicheComponent,
    DesignerComponent,
    FloatingMenuComponent,
    SetInputsComponent,
    SideMenuComponent,
    TextComponent,
    TopBarComponent,
    AddAppActionIoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatModule,
    DragulaModule.forRoot(),
    NgxElectronModule,
    QuillModule,
    DvModule,
    ClicheModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: GATEWAY_URL,
      // the designer is served at 4200
      // requests are proxied to the gateway running at 3000
      useValue: 'http://localhost:4200/api'
    },
    {
      provide: USED_CLICHES_CONFIG,
      useFactory: getUsedClichesConfig
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ActionInstanceComponent,
    AddAppActionIoComponent,
    ConfigureActionComponent,
    ConfigureClicheComponent,
    TextComponent
  ].concat(dvCoreActions)
})
export class AppModule { }
