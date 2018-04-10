import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'comment-show-target',
  templateUrl: './show-target.component.html',
  styleUrls: ['./show-target.component.css']
})
export class ShowTargetComponent implements OnInit {
  @Input() id: string;

  constructor() { }

  ngOnInit() {
  }

}
