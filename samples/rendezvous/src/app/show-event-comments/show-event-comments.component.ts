import { Component, Input } from '@angular/core';
import {
  ShowEventCommentComponent
} from '../show-event-comment/show-event-comment.component';

@Component({
  selector: 'rendezvous-show-event-comments',
  templateUrl: './show-event-comments.component.html',
  styleUrls: ['./show-event-comments.component.css']
})
export class ShowEventCommentsComponent {
  @Input() user: any;
  showEventComment = ShowEventCommentComponent;
}
