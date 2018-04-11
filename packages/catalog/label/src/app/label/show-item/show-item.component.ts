import { Component, Input, OnInit } from '@angular/core';
import { Item } from '../shared/label.model';

@Component({
  selector: 'label-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.css']
})
export class ShowItemComponent implements OnInit {
  @Input() item: Item;

  constructor() { }

  ngOnInit() {
  }
}
