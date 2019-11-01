import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, SimpleChanges, Type
} from '@angular/core';

import { DvService, DvServiceFactory, OnEval, OnExec } from '@deja-vu/core';

import { API_PATH } from '../authorization.config';
import { Resource } from '../shared/authorization.model';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


interface CanViewRes {
  data: { canView: boolean; };
}

@Component({
  selector: 'authorization-add-remove-viewer',
  templateUrl: './add-remove-viewer.component.html',
  styleUrls: ['./add-remove-viewer.component.css']
})
export class AddRemoveViewerComponent
  implements AfterViewInit, OnEval, OnExec, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  @Input() viewerId: string;
  @Input() set viewer(viewer: any) {
    this.viewerId = viewer.id;
  }

  @Input() resourceId: string;
  @Input() set resource(resource: Resource) {
    this.resourceId = resource.id;
  }

  public canViewResource = false;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

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
      const res = await this.dvs.waitAndGet<CanViewRes>(this.apiPath, () => ({
        params: {
          inputs: {
            input: {
              principalId: this.viewerId,
              resourceId: this.resourceId
            }
          },
          extraInfo: { action: 'view' }
        }
      }));
      this.canViewResource = res.data.canView;
    }

  }

  addViewer() {
    this.dvs.exec();
  }

  removeViewer() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    if (!this.dvs) {
      return;
    }
    await this.dvs.waitAndPost<{ data: any }>(this.apiPath, () => ({
      inputs: {
        input: {
          id: this.resourceId,
          viewerId: this.viewerId
        }
      },
      extraInfo: { action: this.getActionToTake() }
    }));
  }

  dvOnExecSuccess() {
    this.canViewResource = !this.canViewResource;
  }

  dvOnExecFailure(reason: Error) {
    console.log(reason.message);
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }

  private getActionToTake() {
    return this.canViewResource ? 'remove' : 'add';
  }
}
