import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'comment-show-author',
  templateUrl: './show-author.component.html',
  styleUrls: ['./show-author.component.css']
})
export class ShowAuthorComponent implements OnInit {
  @Input() id: string;

  constructor() { }

  ngOnInit() {
  }

}
