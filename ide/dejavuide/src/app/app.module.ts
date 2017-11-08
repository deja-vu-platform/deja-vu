import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { HeaderModule } from './components/common/header/header.module';
import { UiEditorModule } from './components/ui_editor/ui_editor.module';
import { UiEditorComponent } from './components/ui_editor/ui_editor.component';

import { ProjectExplorerModule } from './components/project_explorer/project_explorer.module';
import { ProjectExplorerComponent } from './components/project_explorer/project_explorer.component';

import { RouterService } from './services/router.service';

const appRoutes: Routes = [
  { path: 'projects', component: ProjectExplorerComponent},
  { path: 'ui_editor', component: UiEditorComponent }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HeaderModule,
    UiEditorModule,
    ProjectExplorerModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  providers: [RouterService],
  bootstrap: [AppComponent]
})
export class AppModule { }
