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


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-create-transaction',
  templateUrl: './create-transaction.component.html',
  styleUrls: ['./create-transaction.component.css'],
})
export class CreateTransactionComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string = ''; // optional
  @Input() paid: boolean = true;
  // if compoundTransactionId is set, created transaction will be added to it
  @Input() compoundTransactionId: string = '';
  @Output() transaction = new EventEmitter();

  // required input
  @Input() set goodId(goodId: string) {
    this._goodId = goodId;
    this.createTransactionForm.updateValueAndValidity();
  }
  @Input() set buyerId(buyerId: string) {
    this._buyerId = buyerId;
    this.createTransactionForm.updateValueAndValidity();
  }
  @Input() set priceFraction(priceFraction: number) {
    this._priceFraction = priceFraction;
    this.createTransactionForm.updateValueAndValidity();
  }
  private _goodId: string = '';
  private _buyerId: string = '';
  private _priceFraction: number = 1;

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
  }, {
    validator: (control: AbstractControl): {[key: string]: any} => {
      if (!this._goodId) {
        return { required: { goodId: this._goodId } };
      }
      if (!this._buyerId) {
        return { required: { buyerId: this._buyerId } };
      }
      if (this._priceFraction < 0) {
        return { nonnegative: { priceFraction: this._priceFraction } };
      }
      return null;
    }
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

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{data: any}>('/graphql', {
      query: `mutation CreateTransaction($input: CreateTransactionInput!) {
        createTransaction(input: $input) {
          id
        }
      }`,
      variables: {
        input: {
          id: this.id,
          compoundTransactionId: this.compoundTransactionId,
          goodId: this._goodId,
          buyerId: this._buyerId,
          quantity: this.quantityControl.value,
          priceFraction: this._priceFraction,
          paid: this.paid
        }
      }
    })
    .toPromise();

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
