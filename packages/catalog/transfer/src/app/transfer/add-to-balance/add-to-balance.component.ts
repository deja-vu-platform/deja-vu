import {
  Component, ElementRef, EventEmitter, Inject, Input,
  OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';
import { API_PATH } from '../transfer.config';

import { Amount, Transfer } from '../shared/transfer.model';

interface CreateTransferRes {
  data: { addToBalance: Transfer };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'transfer-add-to-balance',
  templateUrl: './add-to-balance.component.html',
  styleUrls: ['./add-to-balance.component.css']
})
export class AddToBalanceComponent
implements OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() showOptionToSubmit = true;
  @Input() showOptionToInputBalance = true;

  @Input() save = true;

  @Output() transfer = new EventEmitter<Transfer>();

  // Optional input values to override form control values
  @Input() set accountId(accountId: string) {
    this.accountIdControl.setValue(accountId);
  }

  @Input() set amount(amount: Amount) {
    this.amountControl.setValue(amount);
  }

  // Presentation inputs
  @Input() accountIdInputPlaceholder = 'To Account';
  @Input() buttonLabel = 'Create Transfer';
  @Input() newTransferSavedText = 'New transfer saved';

  accountIdControl = new FormControl();
  amountControl = new FormControl();

  @ViewChild(FormGroupDirective) form;
  addToBalanceForm = this.builder.group({
    accountIdControl: this.accountIdControl,
    amountControl: this.amountControl
  });

  newTransferSaved = false;
  newTransferError: string;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun() {
    const res = await this.gs.post<CreateTransferRes>(this.apiPath, {
      query: `
        mutation AddToBalance($input: AddToBalanceInput!) {
          addToBalance(input: $input) {
            id
          }
        }
       `,
      variables: {
        input: {
          accountId: this.accountIdControl.value,
          amount: this.amountControl.value
        }
      }
    })
    .toPromise();

   if (res.errors) {
     throw new Error(_.map(res.errors, 'message'));
   }

   this.transfer.emit(res.data.addToBalance);
  }

  dvOnAfterCommit() {
    if (this.showOptionToSubmit && this.save) {
      this.newTransferSaved = true;
      this.newTransferError = '';
      window.setTimeout(() => {
        this.newTransferSaved = false;
      }, SAVED_MSG_TIMEOUT);
     }
     // Can't do `this.form.reset();`
     // See https://github.com/angular/material2/issues/4190
     if (this.form) {
       this.form.resetForm();
     }
  }

  dvOnAfterAbort(reason: Error) {
    if (this.showOptionToSubmit && this.save) {
      this.newTransferError = reason.message;
    }
  }
}
