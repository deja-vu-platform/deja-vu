import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApproveTaskComponent } from './approve-task/approve-task.component';
import { ClaimTaskComponent } from './claim-task/claim-task.component';
import { CompleteTaskComponent } from './complete-task/complete-task.component';
import { CreateTaskComponent } from './create-task/create-task.component';
import { CreateTaskForAllAssigneesComponent } from './create-task-for-all-assignees/create-task-for-all-assignees.component';
import { EditTaskDeadlineAndAssignerComponent } from './edit-task-deadline-and-assigner/edit-task-deadline-and-assigner.component';
import { EditTaskNameComponent } from './edit-task-name/edit-task-name.component';
import { SharedComponent } from './shared/shared.component';
import { ShowApprovedTasksComponent } from './show-approved-tasks/show-approved-tasks.component';
import { ShowAssignedTasksComponent } from './show-assigned-tasks/show-assigned-tasks.component';
import { ShowClaimableTasksComponent } from './show-claimable-tasks/show-claimable-tasks.component';
import { ShowPendingApprovalTasksComponent } from './show-pending-approval-tasks/show-pending-approval-tasks.component';
import { ShowTaskComponent } from './show-task/show-task.component';
import { ShowUnapprovedTasksComponent } from './show-unapproved-tasks/show-unapproved-tasks.component';
import { ShowUnassignedTasksComponent } from './show-unassigned-tasks/show-unassigned-tasks.component';
import { ShowUncompletedTasksComponent } from './show-uncompleted-tasks/show-uncompleted-tasks.component';
import { VendorComponent } from './vendor/vendor.component';
import { BootstrapDatepickerComponent } from './bootstrap-datepicker/bootstrap-datepicker.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ApproveTaskComponent, ClaimTaskComponent, CompleteTaskComponent, CreateTaskComponent, CreateTaskForAllAssigneesComponent, EditTaskDeadlineAndAssignerComponent, EditTaskNameComponent, SharedComponent, ShowApprovedTasksComponent, ShowAssignedTasksComponent, ShowClaimableTasksComponent, ShowPendingApprovalTasksComponent, ShowTaskComponent, ShowUnapprovedTasksComponent, ShowUnassignedTasksComponent, ShowUncompletedTasksComponent, VendorComponent, BootstrapDatepickerComponent]
})
export class TaskModule { }
