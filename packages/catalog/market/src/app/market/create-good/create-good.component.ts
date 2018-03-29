import {
  ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
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

import { Good } from '../shared/market.model';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-create-good',
  templateUrl: './create-good.component.html',
  styleUrls: ['./create-good.component.css']
})
export class CreateGoodComponent
implements OnInit, OnChanges, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string | undefined = '';
  @Input() showOptionToInputSeller = true;
  @Input() showOptionToInputPrice = true;
  @Output() good = new EventEmitter();

  @Input() marketId: string;
  marketIdChange = new EventEmitter<void>();

  // Optional input values to override form control values
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
  @Input() supplyLabel = 'Supply';
  @Input() newGoodSavedText = 'New good saved';

  @ViewChild(FormGroupDirective) form;

  priceControl = new FormControl();
  supplyControl = new FormControl();
  sellerIdControl = new FormControl();
  createGoodForm: FormGroup = this.builder.group({
    priceControl: this.priceControl,
    supplyControl: this.supplyControl,
    sellerIdControl: this.sellerIdControl
  });


  newGoodSaved = false;
  newGoodError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    private ref: ChangeDetectorRef) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    if (!this.sellerId) {
      this.sellerIdControl.clearValidators();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // https://stackoverflow.com/questions/34364880/expression-has-changed-after-it-was-checked
    // The statement below is needed to suppress the error described above.
    this.ref.detectChanges()
    if (changes.marketId) {
      this.marketIdChange.emit();
    }
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    if (!this.marketId) {
      await this.marketIdChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    const res = await this.gs
      .post<{data: {createGood: Good}, errors: {message: string}[]}>('/graphql', {
        query: `mutation CreateGood($input: CreateGoodInput!) {
          createGood (input: $input) {
            id
          }
        }`,
        variables: {
          input: {
            id: this.id,
            price: this.priceControl.value,
            sellerId: this.sellerIdControl.value,
            supply: this.supplyControl.value,
            marketId: this.marketId
          }
        }
      })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

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
