import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Item } from '../shared/label.model';

@Component({
  selector: 'label-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.css'],
  providers: [DatePipe]
})
export class ShowItemComponent {
  @Input() item: Item;
}
