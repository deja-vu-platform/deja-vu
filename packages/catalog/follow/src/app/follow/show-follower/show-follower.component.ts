import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'follow-show-follower',
  templateUrl: './show-follower.component.html',
  styleUrls: ['./show-follower.component.css']
})
export class ShowFollowerComponent implements OnInit {
  @Input() id: string;

  constructor() { }

  ngOnInit() {
  }

}
