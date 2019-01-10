import { Component, ElementRef, Inject, Input, OnInit } from '@angular/core';
import { GatewayService, GatewayServiceFactory, RunService } from 'dv-core';

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
        query: `
          query CanView($input: PrincipalResourceInput!) {
            canView(input: $input)
          }
        `,
        variables: {
          input: {
            principalId: this.viewerId,
            resourceId: this.resourceId
          }
        }
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
    const action = this.getActionToTake();
    this.gs
      .post<{ data: any }>(this.apiPath, {
        query: `
          mutation ${action.mutation}($input: ${action.input}!){
            ${action.name} (input: $input)
          }
        `,
        variables: {
          input: {
            id: this.resourceId,
            viewerId: this.viewerId
          }
        }
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
    const addViewerAction = {
      mutation: 'AddViewerToResource',
      input: 'AddViewerToResourceInput',
      name: 'addViewerToResource'
    };

    const removeViewerAction = {
      mutation: 'RemoveViewerFromResource',
      input: 'RemoveViewerFromResourceInput',
      name: 'removeViewerFromResource'
    };

    return this.canViewResource ? removeViewerAction : addViewerAction;
  }

}
