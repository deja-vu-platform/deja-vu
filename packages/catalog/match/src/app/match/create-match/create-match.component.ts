import {
  Component, ElementRef, Inject, Input, OnInit, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';
import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../match.config';
import { Match } from '../shared/match.model';


interface CreateMatchRes {
  data: { createMatch: Match };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'match-create-match',
  templateUrl: './create-match.component.html',
  styleUrls: ['./create-match.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateMatchComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateMatchComponent,
      multi: true
    }
  ]
})
export class CreateMatchComponent
  implements OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id: string | undefined;
  @Input() set userAId(inputContent: string) {
    this.userAIdControl.setValue(inputContent);
  }
  @Input() set userBId(inputContent: string) {
    this.userBIdControl.setValue(inputContent);
  }
  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Create Match';
  @Input() inputUserAIdLabel = 'User A Id';
  @Input() inputUserBIdLabel = 'User B Id';
  @Input() newMatchSavedText = 'New match saved';

  @ViewChild(FormGroupDirective) form;

  userAIdControl = new FormControl('', Validators.required);
  userBIdControl = new FormControl('', Validators.required);
  createMatchForm: FormGroup = this.builder.group({
    userAIdControl: this.userAIdControl,
    userBIdControl: this.userBIdControl
  });

  newMatchSaved = false;
  newMatchError: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs.post<CreateMatchRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          userAId: this.userAIdControl.value,
          userBId: this.userBIdControl.value
        }
      },
      extraInfo: { returnFields: 'id, userAId, userBId' }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.newMatchSaved = true;
    window.setTimeout(() => {
      this.newMatchSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.newMatchError = reason.message;
  }
}
