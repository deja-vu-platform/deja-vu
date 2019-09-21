import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnDestroy, OnInit, Output, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnEval, OnExec, RunService
} from '@deja-vu/core';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import {
  ShowLabelComponent
} from '../show-label/show-label.component';

import { API_PATH } from '../label.config';
import { Label } from '../shared/label.model';

import * as _ from 'lodash';
import { filter, take, takeUntil } from 'rxjs/operators';


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
  implements AfterViewInit, OnDestroy, OnEval, OnExec, OnInit, OnChanges,
    ControlValueAccessor, Validator {
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
  destroyed = new Subject<any>();
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    private router: Router, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    if (!_.isNil(this.initialValue)) {
      this.selectedLabelIds = _.map(this.initialValue, 'id');
    }
    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.destroyed))
      .subscribe(() => {
        this.load();
      });
  }

  ngAfterViewInit() {
    if (!_.isNil(this.initialValue)) {
      this.search();
    } else {
      this.load();
    }
  }

  ngOnChanges() {
    if (!_.isNil(this.initialValue)) {
      this.search();
    }
  }

  updateSelected(selectedLabelIds: string[]) {
    this.selectedLabelIds = selectedLabelIds;
  }

  search() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    this.gs.get<ItemsRes>(this.apiPath, {
      params: {
        inputs: JSON.stringify({
          input: {
            labelIds: this.selectedLabelIds
          }
        }),
        extraInfo: { action: 'items' }
      }
    })
      .subscribe((res) => {
        this.searchResultItems.emit(res.data.items);
      });
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<LabelsRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({ input: {} }),
          extraInfo: {
            action: 'labels',
            returnFields: 'id'
          }
        }
      })
        .subscribe((res) => {
          this.labels = res.data.labels;
        });
    }
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

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
