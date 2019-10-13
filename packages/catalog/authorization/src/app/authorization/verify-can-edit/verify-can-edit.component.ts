import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  SimpleChanges
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';

import { API_PATH } from '../authorization.config';

import { CanDoRes } from '../shared/authorization.model';


@Component({
  selector: 'authorization-verify-can-edit',
  templateUrl: './verify-can-edit.component.html',
  styleUrls: ['./verify-can-edit.component.css']
})
export class VerifyCanEditComponent implements OnExec, OnEval, OnInit,
  OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();

  @Input() resourceId: string;
  @Input() principalId: string;

  canEdit;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

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
    return this.doAuthorize();
  }

  dvOnExec() {
    return this.doAuthorize();
  }

  async doAuthorize() {
    if (!this.gs || (
      _.isEmpty(this.principalId) && _.isEmpty(this.resourceId) &&
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
    this.gs.get<CanDoRes>(this.apiPath, {
      params: {
        inputs: JSON.stringify({
          input: {
            principalId: this.principalId,
            resourceId: this.resourceId
          }
        })
      }
    })
    .subscribe((res) => {
      this.canEdit = res.data.canDo;
    });
  }
}
