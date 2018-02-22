import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, RouteReuseStrategy } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HeaderModule } from './common/header/header.module';
import { PageNotFoundModule } from './common/page-not-found/page-not-found.module';
import { UiEditorModule } from './ui-editor/ui-editor.module';
import { ProjectExplorerModule } from './project-explorer/project-explorer.module';

import { RouterService } from './services/router.service';
import { PaletteService } from './ui-editor/services/palette.service';
import { StateService } from './ui-editor/services/state.service';
import { ProjectService } from './services/project.service';
import { CommunicatorService } from './services/communicator.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,

    HeaderModule,
    UiEditorModule,
    ProjectExplorerModule,
    PageNotFoundModule,
    // Comes last
    AppRoutingModule
  ],
  providers: [
    RouterService,
    StateService,
    ProjectService,
    CommunicatorService,
    PaletteService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
