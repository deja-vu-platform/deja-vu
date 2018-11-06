import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'hackernews-show-comment',
  templateUrl: './show-comment.component.html',
  styleUrls: ['./show-comment.component.css']
})
export class ShowCommentComponent implements OnInit {
  showComment = ShowCommentComponent;
  @Input() comment: any;
  // TODO: collapsing functionality
  // collapsed: boolean = false;
  // @Input() collapsible: boolean;
  @Input() showAncestorSummary: boolean = false;

  constructor() {
  }

  ngOnInit() {
  }

}
