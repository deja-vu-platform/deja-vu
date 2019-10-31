import { Component, Input } from '@angular/core';

@Component({
  selector: 'task-show-assignee',
  templateUrl: './show-assignee.component.html',
  styleUrls: ['./show-assignee.component.css']
})
export class ShowAssigneeComponent {
  @Input() id: string;
}
