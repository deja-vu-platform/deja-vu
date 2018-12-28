import {
  Component, EventEmitter, Input, Output, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective, NG_VALIDATORS,
  NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import { OpenStreetMapProvider } from 'leaflet-geosearch';
import * as _ from 'lodash';

import { Location } from '../shared/geolocation.model';

const CLEAR_ERRORS_TIMEOUT = 3000;


@Component({
  selector: 'geolocation-search-for-location',
  templateUrl: './search-for-location.component.html',
  styleUrls: ['./search-for-location.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SearchForLocationComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: SearchForLocationComponent,
      multi: true
    }
  ]
})
export class SearchForLocationComponent {
  public searchError: string;
  private provider;

  // Presentation inputs
  @Input() searchLabel = 'Address';
  @Input() buttonLabel = 'Search for Location';

  @Output() location: EventEmitter<Location> = new EventEmitter<Location>();

  @ViewChild(FormGroupDirective) form;
  addressControl = new FormControl('', [Validators.required]);
  searchForLocationForm: FormGroup = this.builder.group({
    addressControl: this.addressControl
  });

  constructor(private builder: FormBuilder) {
    this.provider = new OpenStreetMapProvider();
  }

  onSubmit() {
    this.search();
    this.reset();
  }

  async search() {
    const results = await this.provider
      .search({ query: this.addressControl.value });
    if (_.isEmpty(results)) {
      this.searchError = 'No results. Try again.';
    } else {
      const searchResult = results[0];
      const m: Location = {
        title: searchResult.label,
        latitude: searchResult.y,
        longitude: searchResult.x
      };

      this.location.emit(m);
    }
  }

  reset() {
    this.form.reset();
    this.form.resetForm();

    window.setTimeout(() => {
      this.searchError = '';
    }, CLEAR_ERRORS_TIMEOUT);
  }
}
