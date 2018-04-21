import { Component, Input, OnInit } from '@angular/core';
import { Follower } from '../shared/follow.model';

@Component({
  selector: 'follow-show-follower',
  templateUrl: './show-follower.component.html',
  styleUrls: ['./show-follower.component.css']
})
export class ShowFollowerComponent implements OnInit {
  @Input() follower: Follower;

  constructor() { }

  ngOnInit() {
  }

}
