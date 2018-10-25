import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators
} from '@angular/forms';

import { OnExecCommit, OnExec, RunService } from 'dv-core';

import { ItemCount } from '../shared/transfer.model';

import * as _ from 'lodash';


@Component({
  selector: 'transfer-create-item-count',
  templateUrl: './create-item-count.component.html',
  styleUrls: ['./create-item-count.component.css']
})
export class CreateItemCountComponent
  implements OnInit, OnExec, OnExecCommit {
  idControl = new FormControl(undefined, [Validators.required]);
  countControl = new FormControl(undefined, [Validators.required]);

  @Output() itemCount = new EventEmitter<ItemCount>();
  @Output() itemCountAsAmount = new EventEmitter<ItemCount[]>();

  @Input() emitOnRunOnly = true;

  // Presentation inputs
  @Input() inputCountPlaceholder = 'Count';
  @Input() buttonLabel = 'Add';
  @Input() showOptionToInputItemId = true;
  @Input() showOptionToCreate = true;

  @Input()
  set id(value: string) {
    this.idControl.setValue(value);
  }

  @ViewChild(FormGroupDirective) form;
  createItemCountForm = this.builder.group({
    idControl: this.idControl,
    countControl: this.countControl
  });

  thisItemCount: ItemCount | undefined;

  constructor(
    private elem: ElementRef,
    private rs: RunService, private builder: FormBuilder) {
    this.idControl.valueChanges.subscribe((value: string) => {
      if (this.thisItemCount === undefined) {
        this.thisItemCount = { id: undefined, count: undefined };
      }
      this.thisItemCount.id = value;
      if (!this.emitOnRunOnly) {
        this.emit();
      }
    });
    this.countControl.valueChanges.subscribe((value: number) => {
      if (this.thisItemCount === undefined) {
        this.thisItemCount = { id: undefined, count: undefined };
      }
      this.thisItemCount.count = value;
      if (!this.emitOnRunOnly) {
        this.emit();
      }
    });
  }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  emit() {
    const itemCountToEmit = _.cloneDeep(this.thisItemCount);
    this.itemCount.emit(itemCountToEmit);
    this.itemCountAsAmount.emit([ itemCountToEmit ]);
  }

  dvOnExec() {
    this.emit();
  }

  dvOnExecCommit() {
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }
}
