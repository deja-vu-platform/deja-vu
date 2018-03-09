import { Component, OnInit } from '@angular/core';

import {
  ShowGroupMeetingComponent
} from '../show-group-meeting/show-group-meeting.component';

@Component({
  selector: 'morg-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  showGroupMeeting = ShowGroupMeetingComponent;

  constructor() { }

  ngOnInit() {
  }

}
