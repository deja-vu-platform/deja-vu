import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Task } from '../shared/task.model';

@Component({
  selector: 'task-show-task',
  templateUrl: './show-task.component.html',
  providers: [ DatePipe ]
})
export class ShowTaskComponent {
  @Input() task: Task;

  @Input() showId = true;
  @Input() showAssigner = true;
  @Input() showAssignee = true;
  @Input() showDueDate = true;
  @Input() showDueDateFormat = 'EEE MMM d, y h:mm a';
  @Input() showApproved = true;
  @Input() showCompleted = true;

  @Input() noAssigneeText = 'No assignee';
  @Input() noAssignerText = 'No assigner';
  @Input() noDueDateText = 'No due date';

  @Input() approvedText = 'approved';
  @Input() notApprovedText = 'not approved';
  @Input() completedText = 'completed';
  @Input() incompleteText = 'incomplete';
}
