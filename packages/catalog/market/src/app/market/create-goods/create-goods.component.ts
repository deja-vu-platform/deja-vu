import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, Type,
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

import { API_PATH } from '../market.config';
import { Good } from '../shared/market.model';

interface CreateGoodsResponse {
  data: {createGoods: Good[]};
  errors: {message: string}[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-create-goods',
  templateUrl: './create-goods.component.html',
  styleUrls: ['./create-goods.component.css']
})
export class CreateGoodsComponent
implements OnInit, ControlValueAccessor, Validator, OnAfterCommit {
  // for staging
  @Input() initialStageGoods: Good[] = [];
  @Output() stagedGoods = new EventEmitter<Good[]>();

  @Input() showOptionToInputPrice = true;
  @Input() showOptionToInputSeller = true;
  @Input() sellerId: string | undefined;
  @Input() marketId: string;

  // for creating
  @Input() showOptionToSubmit = true;
  @Input() save = true;
  @Output() createdGoods = new EventEmitter<Good[]>();

  @Input() createGood: Action = {
    type: <Type<Component>> CreateGoodComponent
  };
  @Input() showGood: Action = {
    type: <Type<Component>> ShowGoodComponent
  };
  @Input() stagedGoodsHeader: Action | undefined;


  // Presentation inputs
  @Input() stageGoodButtonLabel = 'Add Good';
  @Input() supplyLabel = 'Supply';
  @Input() createGoodsButtonLabel = 'Create';

  staged: Good[] = [];
  @ViewChild(FormGroupDirective) form;

  createGoodsForm: FormGroup = this.builder.group({});

  newGoodsSaved = false;
  newGoodsError: string;

  private gs: GatewayService;
  stageGoodsComponent = this;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) {}

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

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const newGoods = this.staged.slice()
    if (this.save && newGoods.length > 0) {
      const res = await this.gs
        .post<any>(this.apiPath, {
          query: `mutation CreateGoods($input: [CreateGoodInput!]!) {
            createGoods (input: $input) {
              id
            }
          }`,
          variables: {
            input: _.map(newGoods, this.goodToCreateGoodInput)
          }
        })
        .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }

      this.createdGoods.emit(_.merge(newGoods, res.data.createGoods));
    }
  }

  dvOnAfterCommit() {
    this.staged = [];
    if (this.showOptionToSubmit && this.save) {
      this.newGoodsSaved = true;
      this.newGoodsError = '';
      window.setTimeout(() => {
        this.newGoodsSaved = false;
      }, SAVED_MSG_TIMEOUT);
    }
  }

  dvOnAfterAbort(reason: Error) {
    if (this.showOptionToSubmit && this.save) {
      this.newGoodsError = reason.message;
    }
  }

  private goodToCreateGoodInput(g: Good) {
    const goodInput = _.pick(g, ['id', 'price', 'supply']);
    goodInput.sellerId = g.seller.id;

    return goodInput;
  }
}
