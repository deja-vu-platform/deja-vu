import {
  Component, ElementRef, EventEmitter, Input, OnInit, ViewChild, Output
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import { Good } from '../shared/market.model';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-create-good',
  templateUrl: './create-good.component.html',
  styleUrls: ['./create-good.component.css'],
})
export class CreateGoodComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string = ''; // optional
  @Input() showSellerId: boolean = true;
  @Output() good = new EventEmitter();

  // required input
  @Input() set marketId(marketId: string) {
    this._marketId = marketId;
    this.createGoodForm.updateValueAndValidity();
  }
  private _marketId: string = '';

  // optional input values to override form control values
  @Input() set name(name: string) {
    this.nameControl.setValue(name);
  }
  @Input() set price(price: number) {
    this.priceControl.setValue(price);
  }
  @Input() set supply(supply: number) {
    this.supplyControl.setValue(supply);
  }
  @Input() set sellerId(sellerId: string) {
    this.sellerIdControl.setValue(sellerId);
  }

  // Presentation inputs
  @Input() buttonLabel = 'Create';
  @Input() newGoodSavedText = 'New good saved';

  @ViewChild(FormGroupDirective) form;

  nameControl = new FormControl();
  priceControl = new FormControl();
  supplyControl = new FormControl();
  sellerIdControl = new FormControl();
  createGoodForm: FormGroup = this.builder.group({
    nameControl: this.nameControl,
    priceControl: this.priceControl,
    supplyControl: this.supplyControl,
    sellerIdControl: this.sellerIdControl
  }, {
    validator: (control: AbstractControl): {[key: string]: any} => {
      if (!this._marketId) {
        return {required: {marketId: this._marketId}};
      }
      return null;
    }
  });


  newGoodSaved = false;
  newGoodError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    if (!this.sellerId) {
      this.sellerIdControl.clearValidators();
    }
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{data: {createGood: Good}}>('/graphql', {
      query: `mutation CreateGood($input: CreateGoodInput!) {
        createGood (input: $input) {
          id
        }
      }`,
      variables: {
        input: {
          id: this.id,
          name: this.nameControl.value,
          price: this.priceControl.value,
          sellerId: this.sellerIdControl.value,
          supply: this.supplyControl.value,
          marketId: this._marketId
        }
      }
    })
    .toPromise();

    this.good.emit({ id: res.data.createGood.id });
  }

  dvOnAfterCommit() {
    this.newGoodSaved = true;
    this.newGoodError = '';
    window.setTimeout(() => {
      this.newGoodSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newGoodError = reason.message;
  }
}
