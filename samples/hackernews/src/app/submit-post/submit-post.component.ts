import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'hackernews-submit-post',
  templateUrl: './submit-post.component.html',
  styleUrls: ['./submit-post.component.css']
})
export class SubmitPostComponent implements OnInit {
  postId: string;
  post: any;

  constructor() { }

  ngOnInit() {
  }

}
