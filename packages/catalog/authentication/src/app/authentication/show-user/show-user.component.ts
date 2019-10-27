import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, SimpleChanges, Type
} from '@angular/core';

import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { User } from '../shared/authentication.model';

import { API_PATH } from '../authentication.config';

import * as _ from 'lodash';


@Component({
  selector: 'authentication-show-user',
  templateUrl: './show-user.component.html',
  styleUrls: ['./show-user.component.css']
})
export class ShowUserComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();

  @Input() id: string | undefined;
  @Input() user: User | undefined;
  @Output() loadedUser = new EventEmitter<User>();

  @Input() showId = false;
  @Input() showUsername = true;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

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
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<{ data: any }>(
        this.apiPath, {
          params: {
            inputs: { id: this.id },
            extraInfo: {
              returnFields: `
                id
                username
              `
            }
          }
        });
     const userById = res.data.userById;
     if (userById) {
      this.user = res.data.userById;
     }
     this.loadedUser.emit(this.user);
    } else if (this.dvs) {
      this.dvs.gateway.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs && this.id && !this.user);
  }
}
