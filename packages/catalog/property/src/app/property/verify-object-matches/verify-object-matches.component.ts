import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  ConfigService, ConfigServiceFactory,
  GatewayService, GatewayServiceFactory, OnEval, OnExec, RunService,
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
export class VerifyObjectMatchesComponent implements
  OnInit, OnChanges, OnExec, OnEval, OnExec {
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
  private gs: GatewayService;
  private ws: WaiterService;
  private wsFieldMatching: WaiterService;
  private cs: ConfigService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory, private csf: ConfigServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.cs = this.csf.createConfigService(this.elem);
    this.ws = this.wsf.for(this, this.waitOn);
    this.wsFieldMatching = this.wsf.for(
      this.fieldMatching, _.get(this.fieldMatching, 'waitOn'));
    this.config = this.cs.getConfig();
    this.schema = getPropertiesFromConfig(this.config);

    this.rs.eval(this.elem);
  }

  ngOnChanges(changes) {
    if (this.ws) {
      this.ws.processChanges(changes);
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
      return this.gs.noRequest();
    }
    await this.ws.maybeWait();

    const fields = {
      id: this.id,
      ..._.omit(this.fieldMatching, 'waitOn')
    };
    const adjustedFields = adjustFieldMatching(fields, this.schema);

    this.gs.get<VerifyObjectMatchesRes>(this.apiPath, {
      params: {
        inputs: { fields: adjustedFields }
      }
    })
    .subscribe((res) => {
      this.matches = res.data.verifyObjectMatches;
    });
  }

  canRun() {
    return this.gs;
  }
}
