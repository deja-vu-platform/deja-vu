import { Component, Input, Type } from '@angular/core';
import { Action } from 'dv-core';

import {
  ShowItemCountComponent
} from '../show-item-count/show-item-count.component';

import { ItemCount } from '../shared/transfer.model';


@Component({
  selector: 'transfer-show-item-counts',
  templateUrl: './show-item-counts.component.html',
  styleUrls: ['./show-item-counts.component.css']
})
export class ShowItemCountsComponent {
  @Input() itemCounts: ItemCount[];
  @Input() showItemCount: Action = {
    type: <Type<Component>> ShowItemCountComponent
  };

  @Input() noItemsToShowText = 'No items to show';

  showItemCounts = this;
}
