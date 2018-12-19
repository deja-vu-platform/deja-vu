import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  ShowEventCommentComponent
} from '../show-event-comment/show-event-comment.component';
import {
  ShowMemberNameComponent
} from '../show-member-name/show-member-name.component';

@Component({
  selector: 'rendezvous-show-event-details',
  templateUrl: './show-event-details.component.html',
  styleUrls: ['./show-event-details.component.css']
})
export class ShowEventDetailsComponent implements OnInit {
  @Input() eventId: string;
  @Input() set event(event: any) {
    this.eventId = event.id;
  }
  user: any;
  hostId: string;
  action: string;
  showMemberName = ShowMemberNameComponent;
  showEventComment = ShowEventCommentComponent;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.eventId = params.get('id');
    });
  }
}
