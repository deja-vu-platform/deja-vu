import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../match.config';
import { Match } from '../shared/match.model';

const SAVED_MSG_TIMEOUT = 3000;

interface MatchRes {
  data: { match: Match };
  errors: { message: string }[];
}

interface UpdateMatchRes {
  data: { updateMatch: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'match-update-match',
  templateUrl: './update-match.component.html',
  styleUrls: ['./update-match.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: UpdateMatchComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: UpdateMatchComponent,
      multi: true
    }
  ]
})
export class UpdateMatchComponent implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess, OnChanges {
  @Input() id: string;

  // Presentation text
  @Input() buttonLabel = 'Update Match';
  @Input() inputContentLabel = 'Edit Content';
  @Input() updateMatchSavedText = 'Match updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  updateMatchForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  updateMatchSaved = false;
  updateMatchError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadMatch();
  }

  ngOnChanges() {
    this.loadMatch();
  }

  loadMatch() {
    if (!this.gs || !this.id) {
      return;
    }

    this.gs.get<MatchRes>(this.apiPath, {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          action: 'load',
          returnFields: 'id, content'
        }
      }
    })
    .subscribe((res) => {
      const match = res.data.match;
      if (match) {
        this.contentControl.setValue(match.content);
      }
    });

  }

  startEditing() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<boolean> {
    const res = await this.gs.post<UpdateMatchRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          content: this.contentControl.value
        }
      },
      extraInfo: {
        action: 'update'
      }
    })
    .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.updateMatch;
  }

  dvOnExecSuccess() {
    this.updateMatchSaved = true;
    this.updateMatchError = '';
    window.setTimeout(() => {
      this.updateMatchSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.updateMatchError = reason.message;
  }
}
