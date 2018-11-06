import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  ShowCommentComponent
} from '../show-comment/show-comment.component';
import {
  ShowPostComponent
} from '../show-post/show-post.component';

@Component({
  selector: 'hackernews-show-post-page',
  templateUrl: './show-post-page.component.html',
  styleUrls: ['./show-post-page.component.css']
})
export class ShowPostPageComponent implements OnInit {
  showComment = ShowCommentComponent;
  showPost = ShowPostComponent;
  id: string;
  post: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
    });
  }
}
