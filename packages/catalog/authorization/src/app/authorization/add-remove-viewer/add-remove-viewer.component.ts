import { Component, ElementRef, Inject, Input, OnInit } from '@angular/core';
import { GatewayService, GatewayServiceFactory, RunService } from '@dejavu-lang/core';

import { API_PATH } from '../authorization.config';
import { Resource } from '../shared/authorization.model';

import * as _ from 'lodash';


interface CanViewRes {
  data: { canView: boolean; };
}

@Component({
  selector: 'authorization-add-remove-viewer',
  templateUrl: './add-remove-viewer.component.html',
  styleUrls: ['./add-remove-viewer.component.css']
})
export class AddRemoveViewerComponent implements OnInit {
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
    this.load();
  }

  addViewer() {
    this.rs.exec(this.elem);
  }

  removeViewer() {
    this.rs.exec(this.elem);
  }

  load() {
    if (!this.gs) {
      return;
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

  private getActionToTake() {
    return this.canViewResource ? 'remove' : 'add';
  }
}
