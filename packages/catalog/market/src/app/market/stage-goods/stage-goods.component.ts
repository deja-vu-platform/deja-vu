import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, Type,
  ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import * as _ from 'lodash';

import {
  Action, GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import { CreateGoodComponent } from '../create-good/create-good.component';
import { ShowGoodComponent } from '../show-good/show-good.component';

import { Good } from '../shared/market.model';


@Component({
  selector: 'market-stage-goods',
  templateUrl: './stage-goods.component.html',
  styleUrls: ['./stage-goods.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: StageGoodsComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: StageGoodsComponent,
      multi: true
    }
  ]
})
export class StageGoodsComponent
implements OnInit, ControlValueAccessor, Validator, OnAfterCommit {
  @Input() initialStageGoods: Good[] = [];
  @Output() stagedGoods = new EventEmitter<Good[]>();

  @Input() showOptionToInputPrice = true;
  @Input() showOptionToInputSeller = true;
  @Input() sellerId: string | undefined;
  @Input() marketId: string;

  @Input() createGood: Action = {
    type: <Type<Component>> CreateGoodComponent
  };
  @Input() showGood: Action = {
    type: <Type<Component>> ShowGoodComponent
  };
  @Input() stagedGoodsHeader: Action | undefined;


  // Presentation inputs
  @Input() buttonLabel = 'Add Good';
  @Input() supplyLabel = 'Supply';

  staged: Good[] = [];

  private gs: GatewayService;
  stageGoodsComponent = this;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.staged = this.initialStageGoods;
  }

  stage(good: Good) {
    this.staged.push(good);
    this.stagedGoods.emit(this.staged);
  }

  unstage(index: string) {
    _.pullAt(this.staged, index);
    this.stagedGoods.emit(this.staged);
  }

  dvOnAfterCommit() {
    this.staged = [];
  }

  writeValue(value: Good[]) {
    if (value) {
      this.staged = value;
    } else {
      this.staged = [];
    }
    this.stagedGoods.emit(this.staged);
  }

  registerOnChange(fn: (value: string) => void) {
    this.stagedGoods.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    return null;
  }
}
