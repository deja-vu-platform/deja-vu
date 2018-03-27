import {
  Component, ElementRef, EventEmitter, Input, OnInit, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'group-add-to-group',
  templateUrl: './add-to-group.component.html',
  styleUrls: ['./add-to-group.component.css']
})
export class AddToGroupComponent implements OnInit {
  @Input() id: string;
  @Input() type: 'member' | 'subgroup' = 'member';

  // Presentation inputs
  @Input() autocompletePlaceholder = `Choose ${this.type}`;
  @Input() buttonLabel = `Add ${this.type}`;
  @Input() addSavedText = `${this.type} added to group`;

  @ViewChild(FormGroupDirective) form;

  autocomplete = new FormControl('');
  addForm: FormGroup = this.builder.group({
    autocomplete: this.autocomplete
  });


  addSaved = false;
  addError: string;

  private gs: GatewayService;

  disabledIds: string[] = [];

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load();
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  load() {
    if (!this.gs) {
      return;
    }
    const field = this.type === 'member' ? 'members' : 'subgroups';
    this.gs.get<{data: {group: any}}>('/graphql', {
      params: {
        query: `query {
          group(id: "${this.id}") {
            ${field} \{
              id
            }
          }
        }`
      }
    })
    .subscribe((res) => {
      if (!res.data.group) {
        throw new Error(`Group ${this.id} doesn't exist`);
      }
      this.disabledIds = _.map(res.data.group[field], 'id');
    });
  }

  async dvOnRun(): Promise<void> {
    const mutation = this.type === 'member' ? 'addMember' : 'addSubgroup';
    const res = await this.gs.post<{data: any}>('/graphql', {
      query: `mutation {
        ${mutation}(
          groupId: "${this.id}",
          id: "${this.autocomplete.value}") {
          id
        }
      }`
    })
    .toPromise();
  }

  dvOnAfterCommit() {
    this.addSaved = true;
    window.setTimeout(() => {
      this.addSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.addError = reason.message;
  }
}
