import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'morg-create-group-meeting',
  templateUrl: './create-group-meeting.component.html',
  styleUrls: ['./create-group-meeting.component.css']
})
export class CreateGroupMeetingComponent implements OnInit {
  @Input() groupMeetingSeries: any;
  @Input() groupMeeting: any;

  constructor() { }

  ngOnInit() {
  }

}
