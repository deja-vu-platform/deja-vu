import { Component, Input, OnInit } from '@angular/core';
import { Publisher } from '../shared/follow.model';

@Component({
  selector: 'follow-show-publisher',
  templateUrl: './show-publisher.component.html',
  styleUrls: ['./show-publisher.component.css']
})
export class ShowPublisherComponent implements OnInit {
  @Input() publisher: Publisher;

  constructor() { }

  ngOnInit() {
  }

}
