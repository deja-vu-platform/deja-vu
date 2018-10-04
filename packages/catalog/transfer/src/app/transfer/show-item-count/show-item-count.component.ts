import { Component, Input } from '@angular/core';
import { ItemCount } from '../transfer.config';

@Component({
  selector: 'transfer-show-item-count',
  templateUrl: './show-item-count.component.html',
  styleUrls: ['./show-item-count.component.css']
})
export class ShowItemCountComponent {
  @Input() itemCount: ItemCount;

  // Presentation inputs
  @Input() showItemId = true;
  @Input() showCount = true;
}
