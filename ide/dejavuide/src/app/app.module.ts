import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HeaderModule } from './components/common/header/header.module';
import { ZoomModule } from './components/ui_editor/zoom/zoom.module';
import { MapModule } from './components/ui_editor/map/map.module';
import { WorkSurfaceModule } from './components/ui_editor/worksurface/worksurface.module';
import { StateService } from './services/state.service';
import { ProjectService } from './services/project.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HeaderModule,
    ZoomModule,
    MapModule,
    WorkSurfaceModule
  ],
  providers: [StateService, ProjectService],
  bootstrap: [AppComponent]
})
export class AppModule { }
