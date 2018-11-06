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

  getBaseUrl(url: string): string {
    // regex from https://stackoverflow.com/a/17773849
    const urlMatcher = new RegExp([
      /https?:\/\/(www\.)?/,                          // https://www.
      /([-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6})/,  // base url, group 2
      /\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)?/].map(r => r.source).join(''), 'i');

    const baseUrlGroupIndex = 2;
    const groups = url.match(urlMatcher);
    return (groups && groups.length > baseUrlGroupIndex) ?
      groups[baseUrlGroupIndex] : '';
  }
}
