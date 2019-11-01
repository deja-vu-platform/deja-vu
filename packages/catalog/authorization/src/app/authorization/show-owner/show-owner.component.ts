import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  DvService, DvServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';


@Component({
  selector: 'authorization-show-owner',
  templateUrl: './show-owner.component.html',
  styleUrls: ['./show-owner.component.css']
})
export class ShowOwnerComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  @Input() resourceId: string;
  @Output() ownerId = new EventEmitter<string>();

  _ownerId: string | undefined;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<{ data: { owner: string }}>(this.apiPath, {
        params: {
          inputs: { resourceId: this.resourceId }
        }
      });
      const ownerId = res.data.owner;
      this._ownerId = ownerId;
      this.ownerId.emit(ownerId);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
