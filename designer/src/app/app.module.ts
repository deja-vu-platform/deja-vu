import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DragulaModule } from 'ng2-dragula';
import { NgxElectronModule } from 'ngx-electron';
import { QuillModule } from 'ngx-quill';

import { DvModule, GATEWAY_URL } from '@deja-vu/core';

import { ClicheModule, dvCoreActions } from './cliche.module';
import { MatModule } from './mat.module';

import { ClicheActionDirective } from './cliche-action.directive';

import {
  ActionDefinitionComponent
} from './action-definition/action-definition.component';
import {
  ActionInstanceComponent
} from './action-instance/action-instance.component';
import { AppComponent } from './app.component';
import {
  ConfigureActionComponent
} from './configure-action/configure-action.component';
import {
  ConfigureClicheComponent
} from './configure-cliche/configure-cliche.component';
import { FloatingMenuComponent } from './floating-menu/floating-menu.component';
import {
  InputActionComponent
} from './input-action/input-action.component';
import {
  SetInputsComponent
} from './set-inputs/set-inputs.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { TextComponent } from './text/text.component';
import { TopBarComponent } from './top-bar/top-bar.component';

import { ScopeIO } from './io';

ScopeIO.actionInstanceComponent = ActionInstanceComponent;

@NgModule({
  declarations: [
    ClicheActionDirective,
    ActionDefinitionComponent,
    ActionInstanceComponent,
    AppComponent,
    ConfigureActionComponent,
    ConfigureClicheComponent,
    InputActionComponent,
    SetInputsComponent,
    SideMenuComponent,
    TextComponent,
    TopBarComponent,
    FloatingMenuComponent
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
    ClicheModule
  ],
  providers: [
    {
      provide: GATEWAY_URL,
      // the designer is served at 4200
      // requests are proxied to the gateway running at 3000
      useValue: 'http://localhost:4200/api'
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ActionInstanceComponent,
    ConfigureActionComponent,
    ConfigureClicheComponent,
    InputActionComponent,
    TextComponent
  ].concat(dvCoreActions)
})
export class AppModule { }
