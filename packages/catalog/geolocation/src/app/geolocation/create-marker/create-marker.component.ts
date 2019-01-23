import {
  Component, ElementRef, Input, OnChanges, OnInit, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

const SAVED_MSG_TIMEOUT = 3000;
const LATITUDE_LIMIT = 90;
const LONGITUDE_LIMIT = 180;

@Component({
  selector: 'geolocation-create-marker',
  templateUrl: './create-marker.component.html',
  styleUrls: ['./create-marker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateMarkerComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateMarkerComponent,
      multi: true
    }
  ]
})
export class CreateMarkerComponent implements
  OnInit, OnChanges, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id: string | undefined;
  @Input() mapId: string;

  @Input() set title(label: string | undefined) {
    const markerTitle = label ? label : '';
    this.titleControl.setValue(markerTitle);
  }
  @Input() set latitude(pos: number) {
    this.latitudeControl.setValue(pos);
  }
  @Input() set longitude(pos: number) {
    this.longitudeControl.setValue(pos);
  }

  // Presentation Text
  @Input() buttonLabel = 'Create Marker';
  @Input() titleLabel = 'Marker Title';
  @Input() latitudeLabel = 'Latitude';
  @Input() longitudeLabel = 'Longitude';
  @Input() newMarkerSavedText = 'New marker saved';
  @Input() showOptionToSubmit = true;

  @ViewChild(FormGroupDirective) form;
  titleControl = new FormControl('');
  latitudeControl = new FormControl('',
    [Validators.required,
    Validators.max(LATITUDE_LIMIT),
    Validators.min(-LATITUDE_LIMIT)]);
  longitudeControl = new FormControl('',
    [Validators.required,
    Validators.max(LONGITUDE_LIMIT),
    Validators.min(-LONGITUDE_LIMIT)]);
  createMarkerForm: FormGroup = this.builder.group({
    titleControl: this.titleControl,
    latitudeControl: this.latitudeControl,
    longitudeControl: this.longitudeControl
  });

  newMarkerSaved = false;
  newMarkerError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  ngOnChanges() { }

  async dvOnExec(): Promise<void> {
    const res = await this.gs
      .post<{ data: any, errors: { message: string }[] }>('/graphql', {
        inputs: {
          input: {
            id: this.id,
            title: this.titleControl.value,
            latitude: this.latitudeControl.value,
            longitude: this.longitudeControl.value,
            mapId: this.mapId
          }
        },
        extraInfo: { returnFields: 'id' }
      })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.newMarkerSaved = true;
    this.newMarkerError = '';
    window.setTimeout(() => {
      this.newMarkerSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.newMarkerError = reason.message;
  }
}
