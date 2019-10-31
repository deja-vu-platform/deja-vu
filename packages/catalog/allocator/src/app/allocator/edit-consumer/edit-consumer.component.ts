import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import { API_PATH } from '../allocator.config';

import * as _ from 'lodash';


interface ConsumerOfResourceRes {
  data: { consumerOfResource: string };
}

interface EditConsumerOfResourceRes {
  data: { editConsumerOfResource: boolean };
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'allocator-edit-consumer',
  templateUrl: './edit-consumer.component.html',
  styleUrls: ['./edit-consumer.component.css']
})
export class EditConsumerComponent
  implements AfterViewInit, OnChanges, OnExec, OnExecFailure, OnExecSuccess,
    OnInit {
  @Input() waitOn: string[];
  @Input() resourceId: string;
  @Input() allocationId: string;
  @Input() buttonLabel = 'Save';
  @Input() inputLabel = 'Id';

  @ViewChild(FormGroupDirective) form;

  newConsumerControl = new FormControl('', [
    Validators.required,
    (control: AbstractControl): { [key: string]: any } => {
      if (!this._currentConsumerId ||
        control.value === this._currentConsumerId) {
        return { noChange: this._currentConsumerId };
      }

      return null;
    }
  ]);
  editConsumerForm: FormGroup = this.builder.group({
    newConsumerControl: this.newConsumerControl
  });

  @Input() set newConsumerId(id: string) {
    this.newConsumerControl.setValue(id);
  }
  @Output() currentConsumerId = new EventEmitter();
  _currentConsumerId: string;

  editConsumerSavedText = 'Saved';
  editConsumerSaved = false;
  editConsumerError: string;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    private builder: FormBuilder, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      if (!_.isEmpty(_.omit(changes, 'newConsumerId'))) {
        this.load();
      }
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    const res = await this.dvs.waitAndGet<ConsumerOfResourceRes>(this.apiPath,
      () => ({
        params: {
          inputs: JSON.stringify({
            input: {
              resourceId: this.resourceId,
              allocationId: this.allocationId
            }
          }),
          extraInfo: { action: 'consumer' }
        }
      }));
    const consumerId =  res.data.consumerOfResource;
    this.currentConsumerId.emit(consumerId);
    this._currentConsumerId = consumerId;
    this.newConsumerControl.setValue(consumerId);
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec() {
    if (this.newConsumerControl.value === this._currentConsumerId) {
      return;
    }
    const newConsumerId = this.newConsumerControl.value;
    const res = await this.dvs.waitAndPost<EditConsumerOfResourceRes>(
      this.apiPath, () => ({
        inputs: {
          input: {
            resourceId: this.resourceId,
            allocationId: this.allocationId,
            newConsumerId: newConsumerId
          }
        },
        extraInfo: { action: 'edit' }
      }));
    if (res.data.editConsumerOfResource) {
      this._currentConsumerId = newConsumerId;
    }
  }

  dvOnExecSuccess() {
    this.editConsumerSaved = true;
    window.setTimeout(() => {
      this.editConsumerSaved = false;
    }, SAVED_MSG_TIMEOUT);

    // https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
      this.newConsumerControl.setValue(this._currentConsumerId);
    }
  }

  dvOnExecFailure(reason: Error) {
    this.editConsumerError = reason.message;
  }
}
