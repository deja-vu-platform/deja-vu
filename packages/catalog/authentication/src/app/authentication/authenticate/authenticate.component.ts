import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  SimpleChanges
} from '@angular/core';

import { DvService, DvServiceFactory, OnEval, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';

import { API_PATH } from '../authentication.config';

import { User } from '../shared/authentication.model';


@Component({
  selector: 'authentication-authenticate',
  templateUrl: './authenticate.component.html',
  styleUrls: ['./authenticate.component.css']
})
export class AuthenticateComponent
  implements OnExec, OnEval, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];

  @Input() id: string | undefined;
  @Input() username: string | undefined;
  @Input() user: User | undefined;
  isAuthenticated = false;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs) {
      this.dvs.waiter.processChanges(changes);
    }
  }

  dvOnEval() {
    return this.doAuthenticate();
  }

  dvOnExec() {
    return this.doAuthenticate();
  }

  async doAuthenticate() {
    if (!this.dvs || (
      _.isEmpty(this.id) && _.isEmpty(this.username) && _.isEmpty(this.user) &&
      _.isEmpty(this.waitOn))) {
      // this is essentialy failing the tx if there is one
      return this.dvs.gateway.noRequest();
    }
    const token = this.dvs.getItem('token');
    const res = await this.dvs.waitAndGet<{ data: { verify: boolean } }>(
      this.apiPath, () => ({
        params: {
          inputs: {
            input: {
              id: this.id || _.get(this.user, 'id'),
              username: this.username || _.get(this.user, 'username'),
              token: token
            }
          }
        }
      }));
    this.isAuthenticated = res.data.verify;
  }
}
