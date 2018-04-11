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
  // Fetch rules
  // If undefined then the fetched items are not filtered by that property
  @Input() searchResults: Item[] | undefined;

  @Input() showItem: Action = {
    type: <Type<Component>>ShowItemComponent
  };

  @Input() noItemsToShowText = 'No items to show';
  items: Item[] = [];

  showItems;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showItems = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchItems();
  }

  ngOnChanges() {
    this.fetchItems();
  }

  fetchItems() {
    if (!_.isEmpty(this.searchResults)) {
      // Search Results
      this.items = this.searchResults;
    } else {
      // All items
      if (this.gs) {
        this.gs
          .get<{ data: { items: Item[] } }>('/graphql', {
            params: {
              query: `
                  query Items($input: ItemsInput!) {
                    items(input: $input) {
                      id
                    }
                  }
                `,
              variables: JSON.stringify({
                input: {
                  labelIds: undefined
                }
              })
            }
          })
          .subscribe((res) => {
            this.items = res.data.items;
          });
      }
    }
  }
}
