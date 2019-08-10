import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DragulaModule } from 'ng2-dragula';
import { NgxElectronModule } from 'ngx-electron';
import { QuillModule } from 'ngx-quill';

import { DvModule, GATEWAY_URL, USED_CLICHES_CONFIG } from '@deja-vu/core';

import { AppRoutingModule } from './app-routing.module';
import { ClicheModule, dvCoreComponents } from './cliche.module';
import { MatModule } from './mat.module';

import { DynamicComponentDirective } from './dynamic-component.directive';

import { usedClichesConfig } from './datatypes';

import {
  ComponentDefinitionComponent
} from './component-definition/component-definition.component';
import {
  ComponentInstanceComponent
} from './component-instance/component-instance.component';
import {
  AddAppComponentIoComponent
} from './add-app-component-io/add-app-component-io.component';
import { AppComponent } from './app.component';
import {
  ClicheInstancesComponent
} from './cliche-instances/cliche-instances.component';
import {
  ConfigureComponentComponent
} from './configure-component/configure-component.component';
import {
  ConfigureClicheComponent
} from './configure-cliche/configure-cliche.component';
import { DesignerComponent } from './designer/designer.component';
import { FloatingMenuComponent } from './floating-menu/floating-menu.component';
import { InsertComponentComponent } from './insert-component/insert-component.component';
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

ChildScopeIO.componentInstanceComponent = ComponentInstanceComponent;

@NgModule({
  declarations: [
    DynamicComponentDirective,
    ComponentDefinitionComponent,
    ComponentInstanceComponent,
    AppComponent,
    ClicheInstancesComponent,
    ConfigureComponentComponent,
    ConfigureClicheComponent,
    DesignerComponent,
    FloatingMenuComponent,
    InsertComponentComponent,
    SetInputsComponent,
    SideMenuComponent,
    TextComponent,
    TopBarComponent,
    AddAppComponentIoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
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
      useValue: 'localhost:4200/api'
    },
    {
      provide: USED_CLICHES_CONFIG,
      useFactory: getUsedClichesConfig
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ComponentInstanceComponent,
    AddAppComponentIoComponent,
    ConfigureComponentComponent,
    ConfigureClicheComponent,
    TextComponent
  ].concat(dvCoreComponents)
})
export class AppModule { }
