import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { RouterService } from './services/router.service';
import { ProjectService } from './services/project.service';
import { CommunicatorService } from './services/communicator.service';

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    RouterService,
    ProjectService,
    CommunicatorService,
  ],
})
export class CoreModule { }
