import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'morg-show-group-meeting',
  templateUrl: './show-group-meeting.component.html',
  styleUrls: ['./show-group-meeting.component.css']
})
export class ShowGroupMeetingComponent implements OnInit {
  @Input() groupMeeting;

  constructor() { }

  ngOnInit() {
  }

}
