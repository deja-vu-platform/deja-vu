import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators
} from '@angular/forms';

import { OnAfterCommit, OnRun, RunService } from 'dv-core';

import { ItemCount } from '../shared/transfer.model';


@Component({
  selector: 'transfer-create-item-count',
  templateUrl: './create-item-count.component.html',
  styleUrls: ['./create-item-count.component.css']
})
export class CreateItemCountComponent
  implements OnInit, OnRun, OnAfterCommit {
  itemIdControl = new FormControl(undefined, [Validators.required]);
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
  set itemId(value: string) {
    this.itemIdControl.setValue(value);
  }

  @ViewChild(FormGroupDirective) form;
  createItemCountForm = this.builder.group({
    itemIdControl: this.itemIdControl,
    countControl: this.countControl
  });

  thisItemCount: ItemCount | undefined;

  constructor(
    private elem: ElementRef,
    private rs: RunService, private builder: FormBuilder) {
    this.itemIdControl.valueChanges.subscribe((value: string) => {
      if (this.thisItemCount === undefined) {
        this.thisItemCount = { itemId: undefined, count: undefined };
      }
      this.thisItemCount.itemId = value;
      if (!this.emitOnRunOnly) {
        this.emit();
      }
    });
    this.countControl.valueChanges.subscribe((value: number) => {
      if (this.thisItemCount === undefined) {
        this.thisItemCount = { itemId: undefined, count: undefined };
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
    this.rs.run(this.elem);
  }

  emit() {
    this.itemCount.emit(this.thisItemCount);
    this.itemCountAsAmount.emit([ this.thisItemCount ]);
  }

  dvOnRun() {
    this.emit();
  }

  dvOnAfterCommit() {
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }
}
