import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'hackernews-upvote',
  templateUrl: './upvote.component.html',
  styleUrls: ['./upvote.component.css']
})
export class UpvoteComponent implements OnInit {
  @Input() disabled: boolean;
  @Input() id: string;
  @Input() isPost: boolean;
  @Input() loggedInUser: any;

  constructor() { }

  ngOnInit() {
  }
}
