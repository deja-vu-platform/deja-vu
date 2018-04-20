import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';
import { Follower } from '../shared/follow.model';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'follow-create-follower',
  templateUrl: './create-follower.component.html',
  styleUrls: ['./create-follower.component.css']
})
export class CreateFollowerComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
  @Input() id: string | undefined;
  @Input() buttonLabel = 'Create Follower';

  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() inputLabel = 'Follower Id';
  @Input() newFollowerSavedText = 'New follower saved';

  @Output() follower: EventEmitter<Follower> = new EventEmitter<Follower>();

  newFollowerSaved = false;
  newFollowerError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{
      data: { createFollower: { id: string } }, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation {
          createFollower(id: "${this.id}") {
            id
          }
        }`
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.follower.emit({ id: res.data.createFollower.id });
  }

  dvOnAfterCommit() {
    this.newFollowerSaved = true;
    this.newFollowerError = '';
    window.setTimeout(() => {
      this.newFollowerSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.id = '';
  }

  dvOnAfterAbort(reason: Error) {
    this.newFollowerError = reason.message;
  }
}
