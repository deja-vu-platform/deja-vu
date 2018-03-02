import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { RouterService } from './services/router.service';
import { ProjectService } from './services/project.service';
import { FileService } from './services/file.service';

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    RouterService,
    ProjectService,
    FileService,
  ],
})
export class CoreModule { }
