import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

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
export class ShowItemsComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  @Input() itemIds: string[] = [];
  @Input() noItemsToShowText = 'No items to show';
  @Input() showItem: ComponentValue = {
    type: <Type<Component>> ShowItemComponent
  };

  showItems;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showItems = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    this.dvs.eval();
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<ItemsRes>(this.apiPath, () => ({
        params: {
          inputs: JSON.stringify({ input: {} })
        }
      }));
      this.itemIds = res.data.items;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
