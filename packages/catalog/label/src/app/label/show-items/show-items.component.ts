import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';

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
export class ShowItemsComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();

  @Input() itemIds: string[] = [];

  @Input() noItemsToShowText = 'No items to show';

  @Input() showItem: ComponentValue = {
    type: <Type<Component>> ShowItemComponent
  };

  showItems;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showItems = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.loadItems();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field]) {
        this.fieldChange.emit(field);
      }
    }
    this.loadItems();
  }

  loadItems() {
    this.rs.eval(this.elem);
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (!_.isEmpty(this.waitOn)) {
        await Promise.all(_.chain(this.waitOn)
          .filter((field) => !this[field])
          .map((fieldToWaitFor) => this.fieldChange
            .pipe(filter((field) => field === fieldToWaitFor), take(1))
            .toPromise())
          .value());
      } else {
        this.gs.get<ItemsRes>(this.apiPath, {
          params: {
            inputs: JSON.stringify({ input: {} })
          }
        })
          .subscribe((res) => {
            this.itemIds = res.data.items;
          });
      }
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
