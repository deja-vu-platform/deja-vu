import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, RouteReuseStrategy } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HeaderModule } from './components/common/header/header.module';
import { PageNotFoundModule } from './components/common/page-not-found/page-not-found.module';
import { StateService } from './services/state.service';
import { ProjectService } from './services/project.service';
import { CommunicatorService } from './services/communicator.service';
import { UiEditorModule } from './components/ui-editor/ui-editor.module';
import { ProjectExplorerModule } from './components/project-explorer/project-explorer.module';

import { RouterService } from './services/router.service';
import { PaletteService } from './services/palette.service';

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
