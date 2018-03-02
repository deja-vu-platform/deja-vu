import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HeaderModule } from './shared/header/header.module';
import { PageNotFoundModule } from './shared/page-not-found/page-not-found.module';
import { UiEditorModule } from './ui-editor/ui-editor.module';
import { ProjectExplorerModule } from './project-explorer/project-explorer.module';
import { CoreModule } from './core/core.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,

    CoreModule,
    HeaderModule,
    UiEditorModule,
    ProjectExplorerModule,
    PageNotFoundModule,
    // Comes last
    AppRoutingModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
