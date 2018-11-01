import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, RunService
} from 'dv-core';

import {
  ShowLabelComponent
} from '../show-label/show-label.component';

import { API_PATH } from '../label.config';
import { Label } from '../shared/label.model';

import * as _ from 'lodash';

interface ItemsRes {
  data: { items: string[] };
  errors: { message: string }[];
}

interface LabelsRes {
  data: { labels: Label[] };
  errors: { message: string }[];
}

@Component({
  selector: 'label-search-items-by-labels',
  templateUrl: './search-items-by-labels.component.html',
  styleUrls: ['./search-items-by-labels.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SearchItemsByLabelsComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: SearchItemsByLabelsComponent,
      multi: true
    }
  ]
})
export class SearchItemsByLabelsComponent
  implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue;
  @Input() showLabel = {
    type: ShowLabelComponent
  };

  // Presentation Inputs
  @Input() searchPlaceholder = 'Search for items by selecting labels';
  @Input() buttonLabel = 'Search';

  @Output() searchResultItems = new EventEmitter<string[]>();

  @ViewChild(FormGroupDirective) form;
  searchFormControl = new FormControl('', Validators.required);
  searchForm: FormGroup = this.builder.group({
    searchFormControl: this.searchFormControl
  });

  labels: Label[] = [];
  selectedLabelIds: string[] | undefined;
  searchItemsByLabels = this;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadLabels();
    this.selectedLabelIds = this.initialValue;
  }

  updateSelected(selectedLabelIds: string[]) {
    this.selectedLabelIds = selectedLabelIds;
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnRun(): Promise<void> {
    this.gs.get<ItemsRes>(this.apiPath, {
      params: {
        query: `
          query Items($input: ItemsInput!) {
            items (input: $input)
          }
        `,
        variables: JSON.stringify({
          input: {
            labelIds: this.selectedLabelIds
          }
        })
      }
    })
      .subscribe((res) => {
        this.searchResultItems.emit(res.data.items);
      });
  }

  loadLabels() {
    if (!this.gs) {
      return;
    }
    this.gs.get<LabelsRes>(this.apiPath, {
      params: {
        query: `
          query {
            labels (input: { }) {
              id
            }
          }
        `
      }
    })
      .subscribe((res) => {
        this.labels = res.data.labels;
      });
  }

  writeValue(value: Label[]) {
    if (value) {
      this.selectedLabelIds = _.map(value, 'id');
    } else {
      this.selectedLabelIds = undefined;
    }
  }

  registerOnChange(fn: (value: Label[]) => void) {
    this.searchResultItems.subscribe(fn);
  }

  registerOnTouched() { }

  validate(c: FormControl): ValidationErrors {
    if (!this.selectedLabelIds) {
      return { required: this.selectedLabelIds };
    }

    return null;
  }
}
