import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, RouteReuseStrategy } from '@angular/router';

import { AppComponent } from './app.component';
import { HeaderModule } from './components/common/header/header.module';
import { ZoomModule } from './components/ui_editor/zoom/zoom.module';
import { MapModule } from './components/ui_editor/map/map.module';
import { WorkSurfaceModule } from './components/ui_editor/worksurface/worksurface.module';
import { StateService } from './services/state.service';
import { ProjectService } from './services/project.service';
import { CommunicatorService } from './services/communicator.service';
import { UiEditorModule } from './components/ui_editor/ui_editor.module';
import { UiEditorComponent } from './components/ui_editor/ui_editor.component';
import { ProjectExplorerModule } from './components/project_explorer/project_explorer.module';
import { ProjectExplorerComponent } from './components/project_explorer/project_explorer.component';
import { RouterService } from './services/router.service';
import { CustomRouteReuseStrategy } from './services/CustomRouteReuseStrategy';

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
      // { enableTracing: true } // <-- debugging purposes only
    )
  ],
  providers: [
    RouterService,
    StateService,
    ProjectService,
    CommunicatorService,
    {provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
