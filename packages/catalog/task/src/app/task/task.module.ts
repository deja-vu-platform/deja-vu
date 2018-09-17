import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import { ApproveTaskComponent } from './approve-task/approve-task.component';
import {
  ClaimTaskComponent
} from './claim-task/claim-task.component';
import { CompleteTaskComponent } from './complete-task/complete-task.component';
import {
  CreateDueDateComponent
} from './create-due-date/create-due-date.component';
import {
  CreateTaskComponent
} from './create-task/create-task.component';
import {
  ShowAssigneeComponent
} from './show-assignee/show-assignee.component';
import {
  ShowTaskComponent
} from './show-task/show-task.component';
import {
  ShowTasksComponent
} from './show-tasks/show-tasks.component';
import { UpdateTaskComponent } from './update-task/update-task.component';

const allComponents = [
  ApproveTaskComponent, ClaimTaskComponent,
  CompleteTaskComponent, CreateDueDateComponent, CreateTaskComponent,
  ShowAssigneeComponent, ShowTaskComponent, ShowTasksComponent,
  UpdateTaskComponent
];

@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatDatepickerModule, MatInputModule, MatSelectModule,
    MatFormFieldModule,
    MatMomentDateModule
  ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
})
export class TaskModule { }
