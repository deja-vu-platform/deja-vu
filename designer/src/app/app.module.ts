import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DragulaModule } from 'ng2-dragula';
import { NgxElectronModule } from 'ngx-electron';
import { QuillModule } from 'ngx-quill';

import { DvModule, GATEWAY_URL, USED_CONCEPTS_CONFIG } from '@deja-vu/core';

import { AppRoutingModule } from './app-routing.module';
import { ConceptModule, dvCoreComponents } from './concept.module';
import { MatModule } from './mat.module';

import { DynamicComponentDirective } from './dynamic-component.directive';

import { usedConceptsConfig } from './datatypes';

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
  ConceptInstancesComponent
} from './concept-instances/concept-instances.component';
import {
  ConfigureComponentComponent
} from './configure-component/configure-component.component';
import {
  ConfigureConceptComponent
} from './configure-concept/configure-concept.component';
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

export function getUsedConceptsConfig() {
  return usedConceptsConfig;
}

ChildScopeIO.componentInstanceComponent = ComponentInstanceComponent;

@NgModule({
  declarations: [
    DynamicComponentDirective,
    ComponentDefinitionComponent,
    ComponentInstanceComponent,
    AppComponent,
    ConceptInstancesComponent,
    ConfigureComponentComponent,
    ConfigureConceptComponent,
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
    ConceptModule,
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
      provide: USED_CONCEPTS_CONFIG,
      useFactory: getUsedConceptsConfig
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ComponentInstanceComponent,
    AddAppComponentIoComponent,
    ConfigureComponentComponent,
    ConfigureConceptComponent,
    TextComponent
  ].concat(dvCoreComponents)
})
export class AppModule { }
