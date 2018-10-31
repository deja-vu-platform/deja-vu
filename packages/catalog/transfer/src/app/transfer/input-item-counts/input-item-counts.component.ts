import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import {
  ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { OnExecSuccess, RunService } from 'dv-core';

import { startWith } from 'rxjs/operators';
import {
  CreateItemCountComponent
} from '../create-item-count/create-item-count.component';
import {
  ShowItemCountComponent
} from '../show-item-count/show-item-count.component';

import { ItemCount } from '../shared/transfer.model';

import * as _ from 'lodash';


@Component({
  selector: 'transfer-input-item-counts',
  templateUrl: './input-item-counts.component.html',
  styleUrls: ['./input-item-counts.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputItemCountsComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: InputItemCountsComponent,
      multi: true
    }
  ]
})
export class InputItemCountsComponent
  implements OnInit, ControlValueAccessor, Validator, OnExecSuccess {
  itemsControl = new FormControl(0, [Validators.required]);
  @Output() itemCounts = new EventEmitter<ItemCount[]>();

  // Presentation inputs
  @Input() itemPlaceholder = 'item';

  createItemCount = CreateItemCountComponent;
  showItemCount = ShowItemCountComponent;

  constructor(
    private elem: ElementRef, private rs: RunService) {
  }

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.itemsControl.valueChanges.subscribe((value: ItemCount[]) => {
      this.itemCounts.emit(value);
    });
    this.itemsControl.valueChanges.pipe(startWith(
      this.itemsControl.value));
  }

  writeValue(value: ItemCount[]) {
    if (value === null) {
      this.reset();
    } else {
      this.itemsControl.setValue(
        _.map(value, (itemCount) => _.pick(itemCount, ['id', 'count'])));
    }
  }

  registerOnChange(fn: (value: ItemCount[]) => void) {
    this.itemCounts.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    if (this.itemsControl.pristine) {
      return null;
    }

    return this.itemsControl.errors;
  }

  dvOnExecSuccess() {
    this.reset();
  }

  reset() {
    this.itemsControl.reset();
    this.itemsControl.markAsUntouched();
    this.itemsControl.markAsPristine();
  }
}
