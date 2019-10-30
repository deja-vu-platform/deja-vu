import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  DvService, DvServiceFactory, OnEval, OnExec,
  WaiterService, WaiterServiceFactory
} from '@deja-vu/core';

import * as _ from 'lodash';

import {
  adjustFieldMatching, getFilteredPropertyNames, getPropertiesFromConfig
} from '../shared/property.model';

import { API_PATH } from '../property.config';


interface VerifyObjectMatchesRes {
  data: { verifyObjectMatches: boolean; };
}


@Component({
  selector: 'property-verify-object-matches',
  templateUrl: './verify-object-matches.component.html',
  styleUrls: ['./verify-object-matches.component.css']
})
export class VerifyObjectMatchesComponent
  implements OnInit, OnChanges, OnExec, OnEval, OnExec {
  @Input() waitOn: string[];
  @Input() id: string;
  /**
   * input object type:{ fieldName: fieldValue }
   * will return only the objects with its fieldNames matching the fieldValues.
   * You can also provide a list of fields to wait on with `waitOn`.
   * e.g., { parentId: $parentId, waitOn: ['parentId' ] }
   */
  @Input() fieldMatching = {};

  config;
  schema;
  matches: boolean;
  private dvs: DvService;
  private wsFieldMatching: WaiterService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    private wsf: WaiterServiceFactory, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
    this.wsFieldMatching = this.wsf.for(
      this.fieldMatching, _.get(this.fieldMatching, 'waitOn'));
    this.config = this.dvs.config.getConfig();
    this.schema = getPropertiesFromConfig(this.config);
  }

  ngOnChanges(changes) {
    if (this.dvs) {
      this.dvs.waiter.processChanges(changes);
    }
    if (this.wsFieldMatching) {
      this.wsFieldMatching.processChanges(changes);
    }
  }

  dvOnEval() {
    return this.doVerify();
  }

  dvOnExec() {
    return this.doVerify();
  }

  async doVerify() {
    if (!this.canRun()) {
      // this is essentialy failing the tx if there is one
      return this.dvs.noRequest();
    }
    const res = await this.dvs.waitAndGet<VerifyObjectMatchesRes>(
      this.apiPath, () => {
        const fields = {
          id: this.id,
          ..._.omit(this.fieldMatching, 'waitOn')
        };
        const adjustedFields = adjustFieldMatching(fields, this.schema);

        return {
          params: {
            inputs: { fields: adjustedFields }
          }
        };
      });
    this.matches = res.data.verifyObjectMatches;
  }

  canRun() {
    return this.dvs;
  }
}
