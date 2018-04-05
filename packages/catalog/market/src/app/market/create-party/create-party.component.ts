import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-create-party',
  templateUrl: './create-party.component.html',
  styleUrls: ['./create-party.component.css']
})
export class CreatePartyComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id;
  @Output() party = new EventEmitter;

  // Presentation inputs
  @Input() buttonLabel = 'Create Party';
  @Input() newPartySavedText = 'New party saved';

  @ViewChild(FormGroupDirective) form;

  balanceControl = new FormControl();
  createPartyForm: FormGroup = this.builder.group({
    balanceControl: this.balanceControl
  });

  @Input() set balance(balance: number) {
    this.balanceControl.setValue(balance);
  }

  newPartySaved = false;
  newPartyError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs
      .post<{data: any, errors: {message: string[]}}>('/graphql', {
        query: `mutation CreateParty($input: CreatePartyInput!) {
          createParty(input: $input) {
            id
          }
        }`,
        variables: {
          input: {
            id: this.id,
            balance: this.balanceControl.value
          }
        }
      })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.party.emit({ id: res.data.createParty.id });
  }

  dvOnAfterCommit() {
    this.newPartySaved = true;
    this.newPartyError = '';
    window.setTimeout(() => {
      this.newPartySaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newPartyError = reason.message;
  }
}
