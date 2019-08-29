import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, SimpleChanges, Type
} from '@angular/core';


import {
  GatewayService, GatewayServiceFactory, OnEval, OnExec, RunService
} from '@deja-vu/core';

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
export class AddRemoveViewerComponent implements AfterViewInit, OnEval, OnExec,
  OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
  @Input() viewerId: string;
  @Input() set viewer(viewer: any) {
    this.viewerId = viewer.id;
  }

  @Input() resourceId: string;
  @Input() set resource(resource: Resource) {
    this.resourceId = resource.id;
  }

  public canViewResource = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field] && !_.isNil(changes[field].currentValue)) {
        this.fieldChange.emit(field);
      }
    }
    // We should only reload iif what changed is something we are not
    // waiting on (because if ow we would send a double request)
    let shouldLoad = false;
    for (const fieldThatChanged of _.keys(changes)) {
      if (!this.activeWaits.has(fieldThatChanged)) {
        shouldLoad = true;
      }
    }
    if (shouldLoad) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (!_.isEmpty(this.waitOn)) {
        await Promise.all(_.chain(this.waitOn)
          .filter((field) => _.isNil(this[field]))
          .tap((fs) => {
            this.activeWaits = new Set(fs);

            return fs;
          })
          .map((fieldToWaitFor) => this.fieldChange
            .pipe(filter((field) => field === fieldToWaitFor), take(1))
            .toPromise())
          .value());
      }
      this.gs.get<CanViewRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              principalId: this.viewerId,
              resourceId: this.resourceId
            }
          },
          extraInfo: { action: 'view' }
        }
      })
        .subscribe((res) => {
          this.canViewResource = res.data.canView;
        });
    }

  }

  addViewer() {
    this.rs.exec(this.elem);
  }

  removeViewer() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    if (!this.gs) {
      return;
    }
    this.gs
      .post<{ data: any }>(this.apiPath, {
        inputs: {
          input: {
            id: this.resourceId,
            viewerId: this.viewerId
          }
        },
        extraInfo: { action: this.getActionToTake() }
      })
      .toPromise();
  }

  dvOnExecSuccess() {
    this.canViewResource = !this.canViewResource;
  }

  dvOnExecFailure(reason: Error) {
    console.log(reason.message);
  }

  private canEval(): boolean {
    return !!(this.gs);
  }

  private getActionToTake() {
    return this.canViewResource ? 'remove' : 'add';
  }
}
