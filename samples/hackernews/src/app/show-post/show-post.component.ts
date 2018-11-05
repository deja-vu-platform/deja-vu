import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'hackernews-show-post',
  templateUrl: './show-post.component.html',
  styleUrls: ['./show-post.component.css']
})
export class ShowPostComponent implements OnInit {
  @Input() id: string;
  @Output() loadedPost = new EventEmitter();
  post: any;

  constructor() { }

  ngOnInit() {
  }

  outputPost(value) {
    this.loadedPost.emit(value);
  }
}
