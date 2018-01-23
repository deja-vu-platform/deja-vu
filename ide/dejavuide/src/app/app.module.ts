import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, RouteReuseStrategy } from '@angular/router';

import { AppComponent } from './app.component';
import { HeaderModule } from './components/common/header/header.module';
import { PageNotFoundModule, PageNotFoundComponent } from './components/common/page-not-found/page-not-found.module';
import { ZoomModule } from './components/ui-editor/zoom/zoom.module';
import { MapModule } from './components/ui-editor/map/map.module';
import { WorkSurfaceModule } from './components/ui-editor/worksurface/worksurface.module';
import { StateService } from './services/state.service';
import { ProjectService } from './services/project.service';
import { CommunicatorService } from './services/communicator.service';
import { UiEditorModule } from './components/ui-editor/ui-editor.module';
import { UiEditorComponent } from './components/ui-editor/ui-editor.component';
import { ProjectExplorerModule } from './components/project-explorer/project-explorer.module';
import { ProjectExplorerComponent } from './components/project-explorer/project-explorer.component';
import { RouterService } from './services/router.service';
import { CustomRouteReuseStrategy } from './services/CustomRouteReuseStrategy';
import { PaletteService } from './services/palette.service';

const appRoutes: Routes = [
  { path: 'projects', component: ProjectExplorerComponent},
  { path: 'ui-editor', component: UiEditorComponent },
  { path: '**', component: PageNotFoundComponent }
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
    PageNotFoundModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  providers: [
    RouterService,
    StateService,
    ProjectService,
    CommunicatorService,
    PaletteService,
    {provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
