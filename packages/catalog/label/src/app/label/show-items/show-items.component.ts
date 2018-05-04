import {
  Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { API_PATH } from '../label.config';

import { ShowItemComponent } from '../show-item/show-item.component';

interface ItemsRes {
  data: { items: string[] };
  errors: { message: string }[];
}

@Component({
  selector: 'label-show-items',
  templateUrl: './show-items.component.html',
  styleUrls: ['./show-items.component.css']
})
export class ShowItemsComponent implements OnInit, OnChanges {
  @Input() itemIds: string[] = [];

  @Input() showItem: Action = {
    type: <Type<Component>>ShowItemComponent
  };

  @Input() noItemsToShowText = 'No items to show';

  showItems;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) {
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
    if (_.isEmpty(this.itemIds) && !_.isNil(this.itemIds)) {
      // All items
      if (this.gs) {
        this.gs
          .get<ItemsRes>(this.apiPath, {
            params: {
              query: `
                query {
                  items(input: { })
                }
              `
            }
          })
          .subscribe((res) => {
            this.itemIds = res.data.items;
          });
      }
    }
  }
}
