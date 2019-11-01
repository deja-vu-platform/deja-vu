import {
  Component, ElementRef, EventEmitter, Inject, Input,
  OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

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
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
  @Input() showOptionToSubmit = true;
  @Input() showOptionToInputBalance = true;
  @Input() showOptionToInputAccountId = true;

  @Input() save = true;

  @Output() transfer = new EventEmitter<Transfer>();

  // Optional input values to override form control values
  @Input() set accountId(accountId: string) {
    this.accountIdControl.setValue(accountId);
  }

  @Input() set amount(amount: Amount) {
    if (amount !== undefined) { this.amountControl.setValue(amount); }
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
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec() {
    const res = await this.dvs.post<CreateTransferRes>(this.apiPath, {
      inputs: {
        input: {
          accountId: this.accountIdControl.value,
          amount: this.amountControl.value
        }
      },
      extraInfo: { returnFields: 'id' }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join('\n'));
    }

    this.transfer.emit(res.data.addToBalance);
  }

  dvOnExecSuccess() {
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

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit && this.save) {
      this.newTransferError = reason.message;
    }
  }
}
