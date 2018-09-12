import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { GatewayService, GatewayServiceFactory } from 'dv-core';

import { v4 as uuid } from 'uuid';

import {
  ShowAssigneeComponent
} from '../show-assignee/show-assignee.component';

import { Assignee } from '../shared/task.model';


@Component({
  selector: 'task-assignee-select',
  templateUrl: './assignee-select.component.html',
  styleUrls: ['./assignee-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: AssigneeSelectComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: AssigneeSelectComponent,
      multi: true
    }
  ]
})
export class AssigneeSelectComponent
  implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue;
  @Input() assigneeSelectPlaceholder = 'Choose Assignee';
  @Input() showAssignee = {
    type: ShowAssigneeComponent
  };
  @Output() selectedAssignee = new EventEmitter<Assignee>();

  assignees: Assignee[] = [];
  selectedAssigneeId: string | undefined;
  assigneeSelect = this;
  private gs: GatewayService;

  selectId = uuid();

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadAssignees();
    this.selectedAssigneeId = this.initialValue;
  }

  updateSelected(selectedAssigneeId: string) {
    this.selectedAssigneeId = selectedAssigneeId;
    this.selectedAssignee.emit({id : selectedAssigneeId });
  }

  loadAssignees() {
    if (!this.gs) {
      return;
    }
    this.gs.get<{data: {assignees: {id: string}[]}}>('/graphql', {
      params: {
        query: `
          query {
            assignees {
              id
            }
          }
        `
      }
    })
    .subscribe((res) => {
      this.assignees = res.data.assignees;
    });
  }

  writeValue(value: Assignee) {
    this.selectedAssigneeId = value ? value.id : undefined;
  }

  registerOnChange(fn: (value: Assignee) => void) {
    this.selectedAssignee.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    if (!this.selectedAssigneeId) {
      return {required: this.selectedAssigneeId};
    }

    return null;
  }
}
