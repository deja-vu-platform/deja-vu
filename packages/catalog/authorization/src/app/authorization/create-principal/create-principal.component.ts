import {
  Component, ElementRef, EventEmitter,
  Input, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Principal } from '../../../../shared/authorization.model';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'authorization-create-principal',
  templateUrl: './create-principal.component.html',
  styleUrls: ['./create-principal.component.css']
})
export class CreatePrincipalComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  // Presentation Inputs
  @Input() id: string;
  @Input() buttonLabel = 'Create Principal';
  @Input() principalInputLabel = 'Id';
  @Input() newPrincipalSuccessText = 'New principal created';

  @Output() principal = new EventEmitter();

  newPrincipalSuccess = false;
  newPrincipalErrorText: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs
      .post<{ data: { createPrincipal: { id: string } } }>(
        '/graphql', {
          query: `mutation {
          createPrincipal (id: "${this.id}") {
            id
          }
        }`
        })
      .toPromise();
    this.principal.emit({ id: res.data.createPrincipal.id });
  }

  dvOnAfterCommit() {
    this.newPrincipalSuccess = true;
    window.setTimeout(() => {
      this.newPrincipalSuccess = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.newPrincipalErrorText = reason.message;
  }
}