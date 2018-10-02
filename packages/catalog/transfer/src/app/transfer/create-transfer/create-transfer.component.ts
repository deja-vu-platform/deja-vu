import {
  Component, ElementRef, EventEmitter, Inject, Input,
  OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroupDirective
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';
import { API_PATH } from '../transfer.config';

import { Transfer } from '../shared/transfer.model';

interface CreateTransferRes {
  data: { createTransfer: Transfer };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'transfer-create-transfer',
  templateUrl: './create-transfer.component.html',
  styleUrls: ['./create-transfer.component.css']
})
export class CreateTransferComponent
implements OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string | undefined = '';
  @Input() showOptionToSubmit = true;
  @Input() showOptionToInputAmount = true;

  @Input() save = true;

  @Output() transfer = new EventEmitter<Transfer>();

  // Optional input values to override form control values
  @Input() set fromId(fromId: string | undefined) {
    this.fromIdControl.setValue(fromId);
  }

  @Input() set toId(toId: string) {
    this.toIdControl.setValue(toId);
  }

  // Presentation inputs
  @Input() fromIdInputPlaceholder = 'From Account';
  @Input() toIdInputPlaceholder = 'To Account';
  @Input() buttonLabel = 'Create Transfer';
  @Input() newTransferSavedText = 'New transfer saved';

  fromIdControl = new FormControl();
  toIdControl = new FormControl();
  amountControl = new FormControl();

  @ViewChild(FormGroupDirective) form;
  createTransferForm = this.builder.group({
    fromIdControl: this.fromIdControl,
    toIdControl: this.toIdControl,
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
        mutation CreateTransfer($input: CreateTransferInput!) {
          createTransfer(input: $input) {
            id
          }
        }
       `,
      variables: {
        input: {
          id: this.id,
          fromId: this.fromIdControl.value,
          toId: this.toIdControl.value,
          amount: this.amountControl.value
        }
      }
    })
    .toPromise();

   if (res.errors) {
     throw new Error(_.map(res.errors, 'message'));
   }

   this.transfer.emit(res.data.createTransfer);
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