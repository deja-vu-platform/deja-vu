import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HeaderModule } from './components/common/header/header.module';
import { UiEditorModule } from './components/ui_editor/ui_editor.module';
import { ProjectExplorerModule } from './components/project_explorer/project_explorer.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HeaderModule,
    UiEditorModule,
    ProjectExplorerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
