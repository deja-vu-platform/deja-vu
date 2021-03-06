import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, Type,
  ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  ComponentValue, DvService, DvServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';
import { API_PATH } from '../transfer.config';

import { InputAmountComponent } from '../input-amount/input-amount.component';
import { Amount, Transfer } from '../shared/transfer.model';

interface CreateTransferRes {
  data: { createTransfer: Transfer };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'transfer-create-transfer',
  templateUrl: './create-transfer.component.html',
  styleUrls: ['./create-transfer.component.css'],
  entryComponents: [ InputAmountComponent ]
})
export class CreateTransferComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
  @Input() id: string | undefined = '';
  @Input() showOptionToSubmit = true;
  @Input() showOptionToInputAmount = true;

  @Input() save = true;
  @Input() inputAmount: ComponentValue = {
    type: <Type<Component>> InputAmountComponent
  };

  @Output() transfer = new EventEmitter<Transfer>();

  // Optional input values to override form control values
  @Input() set fromId(fromId: string | undefined) {
    this.fromIdControl.setValue(fromId);
  }

  @Input() set toId(toId: string) {
    this.toIdControl.setValue(toId);
  }

  @Input() amount: Amount;

  // Presentation inputs
  @Input() fromIdInputPlaceholder = 'From Account';
  @Input() toIdInputPlaceholder = 'To Account';
  @Input() buttonLabel = 'Create Transfer';
  @Input() newTransferSavedText = 'New transfer saved';
  @Input() showOptionToInputFromId = true;
  @Input() showOptionToInputToId = true;

  fromIdControl = new FormControl();
  toIdControl = new FormControl();

  @ViewChild(FormGroupDirective) form;
  createTransferForm = this.builder.group({
    fromIdControl: this.fromIdControl,
    toIdControl: this.toIdControl
  });

  newTransferSaved = false;
  newTransferError: string;
  private dvs: DvService;

  createTransfer = this;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    private builder: FormBuilder, @Inject(API_PATH) private apiPath) {}

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
          id: this.id,
          fromId: this.fromIdControl.value,
          toId: this.toIdControl.value,
          amount: this.amount
        }
      },
      extraInfo: { returnFields: 'id' }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join('\n'));
    }

    this.transfer.emit(res.data.createTransfer);
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
