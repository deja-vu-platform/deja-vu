import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'authorization-show-resource',
  templateUrl: './show-resource.component.html',
  styleUrls: ['./show-resource.component.css']
})
export class ShowResourceComponent implements OnInit {
  @Input() id: string;

  constructor() { }

  ngOnInit() {
  }

}
