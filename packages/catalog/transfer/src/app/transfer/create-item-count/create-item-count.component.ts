import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators
} from '@angular/forms';

import { OnAfterCommit, OnRun, RunService } from 'dv-core';

import { ItemCount } from '../transfer.config';


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

  constructor(
    private elem: ElementRef,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  dvOnRun() {
    this.itemCount.emit({
      itemId: this.itemIdControl.value, count: this.countControl.value
    });
  }

  dvOnAfterCommit() {
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }
}
