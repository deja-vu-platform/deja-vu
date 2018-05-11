import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'label-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.css'],
  providers: [DatePipe]
})
export class ShowItemComponent {
  @Input() id: string;
}
