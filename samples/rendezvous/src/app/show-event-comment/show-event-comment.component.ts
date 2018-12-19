import { Component, Input } from '@angular/core';

@Component({
  selector: 'rendezvous-show-event-comment',
  templateUrl: './show-event-comment.component.html',
  styleUrls: ['./show-event-comment.component.css']
})
export class ShowEventCommentComponent {
  @Input() loggedInUserId: string;
  @Input() comment: Comment;

  ngOnInit() {
    console.log('yo', this.loggedInUserId);
  }
}

interface Comment {
  id: string;
  authorId: string;
  targetId: string;
  content: string;
}
