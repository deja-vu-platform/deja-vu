import { Component, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'hackernews-show-post',
  templateUrl: './show-post.component.html',
  styleUrls: ['./show-post.component.css']
})
export class ShowPostComponent implements OnInit {
  @Input() id: string;
  post: any;

  constructor() { }

  ngOnInit() {
  }

}
