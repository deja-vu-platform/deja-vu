import { Component, OnInit } from '@angular/core';

import {
  ShowPostComponent
} from '../show-post/show-post.component';

@Component({
  selector: 'hackernews-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  showPost = ShowPostComponent;
  user: any;

  constructor() { }

  ngOnInit() {
  }

}
