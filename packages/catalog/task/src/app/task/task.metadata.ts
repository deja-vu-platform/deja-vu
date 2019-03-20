import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { ApproveTaskComponent } from './approve-task/approve-task.component';
export { ApproveTaskComponent };
import {
  ClaimTaskComponent
} from './claim-task/claim-task.component';
export { ClaimTaskComponent };
import { CompleteTaskComponent } from './complete-task/complete-task.component';
export { CompleteTaskComponent };
import {
  CreateDueDateComponent
} from './create-due-date/create-due-date.component';
export { CreateDueDateComponent };
import {
  CreateTaskComponent
} from './create-task/create-task.component';
export { CreateTaskComponent };
import {
  ShowAssigneeComponent
} from './show-assignee/show-assignee.component';
export { ShowAssigneeComponent };
import {
  ShowTaskComponent
} from './show-task/show-task.component';
export { ShowTaskComponent };
import {
  ShowTasksComponent
} from './show-tasks/show-tasks.component';
export { ShowTasksComponent };
import { UpdateTaskComponent } from './update-task/update-task.component';
export { UpdateTaskComponent };
import {
  ShowTaskCountComponent
} from './show-task-count/show-task-count.component';
export { ShowTaskCountComponent };
import {
  CreateTasksForAssigneesComponent
} from './create-tasks-for-assignees/create-tasks-for-assignees.component';
export { CreateTasksForAssigneesComponent };
import { StageComponent } from './stage/stage.component';
export { StageComponent };
import {
  InputAssigneeComponent
} from './input-assignee/input-assignee.component';
export { InputAssigneeComponent };


const allComponents = [
  ApproveTaskComponent, ClaimTaskComponent,
  CompleteTaskComponent, CreateDueDateComponent, CreateTaskComponent,
  ShowAssigneeComponent, ShowTaskComponent, ShowTasksComponent,
  UpdateTaskComponent, ShowTaskCountComponent, CreateTasksForAssigneesComponent,
  StageComponent, InputAssigneeComponent
];

const metadata = {
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
};

export { metadata };
