import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  SimpleChanges
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, OnExec, RunService,
  StorageService
} from '@deja-vu/core';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';

import { API_PATH } from '../authentication.config';

import { User } from '../shared/authentication.model';


@Component({
  selector: 'authentication-authenticate',
  templateUrl: './authenticate.component.html',
  styleUrls: ['./authenticate.component.css']
})
export class AuthenticateComponent implements OnExec, OnEval, OnInit,
  OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();

  @Input() id: string | undefined;
  @Input() username: string | undefined;
  @Input() user: User | undefined;
  isAuthenticated = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath,
    private ss: StorageService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field] && !_.isNil(changes[field].currentValue)) {
        this.fieldChange.emit(field);
      }
    }
  }

  dvOnEval() {
    return this.doAuthenticate();
  }

  dvOnExec() {
    return this.doAuthenticate();
  }

  async doAuthenticate() {
    if (!this.gs || (
      _.isEmpty(this.id) && _.isEmpty(this.username) && _.isEmpty(this.user) &&
      _.isEmpty(this.waitOn))) {
      // this is essentialy failing the tx if there is one
      return this.gs.noRequest();
    }
    if (!_.isEmpty(this.waitOn)) {
      await Promise.all(_.chain(this.waitOn)
        .filter((field) => _.isNil(this[field]))
        .map((fieldToWaitFor) => this.fieldChange
          .pipe(filter((field) => field === fieldToWaitFor), take(1))
          .toPromise())
        .value());
    }
    const token = this.ss.getItem(this.elem, 'token');
    const res = await this.gs.get<{ data: { verify: boolean } }>(this.apiPath, {
        params: {
          inputs: {
            input: {
              id: this.id || _.get(this.user, 'id'),
              username: this.username || _.get(this.user, 'username'),
              token: token
            }
          }
        }
      })
      .toPromise();
    this.isAuthenticated = res.data.verify;
  }
}
