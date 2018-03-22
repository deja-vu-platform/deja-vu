import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges, ViewChild
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import { take } from 'rxjs/operators';

import * as _ from 'lodash';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-create-transaction',
  templateUrl: './create-transaction.component.html',
  styleUrls: ['./create-transaction.component.css'],
})
export class CreateTransactionComponent implements
  OnInit, OnChanges, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string = ''; // optional
  @Input() paid: boolean = true;
  // if compoundTransactionId is set, created transaction will be added to it
  @Input() compoundTransactionId: string = '';
  @Output() transaction = new EventEmitter();

  // required input
  @Input() goodId: string;
  goodIdChange = new EventEmitter<void>();
  @Input() buyerId: string;
  buyerIdChange = new EventEmitter<void>();
  // optional, but needs to be a nonnegative number
  @Input() priceFraction: number = 1;

  // optional input value to override form control values
  @Input() set quantity(quantity: string) {
    this.quantityControl.setValue(quantity);
  }

  // Presentation inputs
  @Input() inputQuantityLabel: string = 'Quantity';
  @Input() buttonLabel: string = 'Buy';
  @Input() newTransactionSavedText: string = 'New transaction saved';

  @ViewChild(FormGroupDirective) form;

  quantityControl = new FormControl(1, [
    Validators.required,
    (control: AbstractControl): {[key: string]: any} => {
      const quantity = control.value;
      if (!quantity) {
        return null;
      }
      if (quantity <= 0) {
        return {
          positive: {
            quantity: quantity
          }
        };
      }
      return null;
    }
  ]);
  createTransactionForm: FormGroup = this.builder.group({
    quantityControl: this.quantityControl
  });


  newTransactionSaved = false;
  newTransactionError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.goodId) {
      this.goodIdChange.emit();
    }
    if (changes.buyerId) {
      this.buyerIdChange.emit();
    }
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    if (this.goodId === undefined) {
      await this.goodIdChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    if (this.buyerId === undefined) {
      await this.buyerIdChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }

    const res = await this.gs
      .post<{data: any, errors: {message: string}[]}>('/graphql', {
        query: `mutation CreateTransaction($input: CreateTransactionInput!) {
          createTransaction(input: $input) {
            id
          }
        }`,
        variables: {
          input: {
            id: this.id,
            compoundTransactionId: this.compoundTransactionId,
            goodId: this.goodId,
            buyerId: this.buyerId,
            quantity: this.quantityControl.value,
            priceFraction: _.isNumber(this.priceFraction) ? this.priceFraction : 1,
            paid: this.paid
          }
        }
      })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.transaction.emit({ id: res.data.createTransaction.id });
  }

  dvOnAfterCommit() {
    this.newTransactionSaved = true;
    this.newTransactionError = '';
    window.setTimeout(() => {
      this.newTransactionSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newTransactionError = reason.message;
  }
}
