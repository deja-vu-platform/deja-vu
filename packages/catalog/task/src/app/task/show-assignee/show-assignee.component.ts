import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'task-show-assignee',
  templateUrl: './show-assignee.component.html',
  styleUrls: ['./show-assignee.component.css']
})
export class ShowAssigneeComponent implements OnInit {
  @Input() id: string;

  constructor() { }

  ngOnInit() {
  }

}
