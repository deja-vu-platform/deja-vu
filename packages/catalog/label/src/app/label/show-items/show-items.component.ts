import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { ShowItemComponent } from '../show-item/show-item.component';

import { Item } from '../shared/label.model';


@Component({
  selector: 'label-show-items',
  templateUrl: './show-items.component.html',
  styleUrls: ['./show-items.component.css']
})
export class ShowItemsComponent implements OnInit, OnChanges {
  @Input() items: Item[] = [];

  @Input() showItem: Action = {
    type: <Type<Component>>ShowItemComponent
  };

  @Input() noItemsToShowText = 'No items to show';

  showItems;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showItems = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadItems();
  }

  ngOnChanges() {
    this.loadItems();
  }

  loadItems() {
    if (_.isEmpty(this.items)) {
      // All items
      if (this.gs) {
        this.gs
          .get<{ data: { items: Item[] } }>('/graphql', {
            params: {
              query: `
                query {
                  items(input: { }) {
                    id
                  }
                }
              `
            }
          })
          .subscribe((res) => {
            this.items = res.data.items;
          });
      }
    }
  }
}
