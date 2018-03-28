import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, Type, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import {Observable} from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';
import { startWith } from 'rxjs/operators/startWith';

import * as _ from 'lodash';

import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';

import { ShowGroupComponent } from '../show-group/show-group.component';
import { ShowMemberComponent } from '../show-member/show-member.component';


@Component({
  selector: 'group-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: AutocompleteComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: AutocompleteComponent,
      multi: true
    }
  ]
})
export class AutocompleteComponent
implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue: string | undefined;
  @Input() autocompletePlaceholder = 'Choose One';
  @Input() type: 'member' | 'group' = 'member';
  @Input() required = true;
  @Input() requiredErrorMsg = `
    This field is <strong>required</strong>
  `;
  @Input() notAnOptionErrorMsgFn = ((selectedId) => `
    ${selectedId} is not a valid option
  `);
  @Input() disabledIds: string[] = [];
  @Input() showMember: Action =  {
    type: <Type<Component>> ShowMemberComponent
  };
  @Input() showGroup: Action = {
    type: <Type<Component>> ShowGroupComponent
  };

  @Output() selectedId = new EventEmitter<string>();

  control: FormControl = new FormControl('', [
    (c: AbstractControl): ValidationErrors => {
      if (c.pristine) {
        return null;
      }
      const selectedId = c.value;
      if (this.required && !selectedId) {
        return {required: selectedId};
      }
      if (!_.includes(this.ids, selectedId)) {
        return {notAnOption: selectedId};
      }

      return null;
    }
  ]);
  ids: string[] = [];
  filteredIds: Observable<string[]>;
  autocompleteControl = this;

  errors: any;

  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.load();
  }

  load() {
    if (!this.gs) {
      return;
    }
    const query = this.type === 'member' ? 'members' : 'groups';
    this.gs.get<{data: any}>('/graphql', {
      params: {
        query: `
          query {
            ${query}(input: {}) {
              id
            }
          }
        `
      }
    })
    .subscribe((res) => {
      this.ids = _.map(res.data[query], 'id');
      this.filteredIds = this.control
        .valueChanges
        .pipe(startWith(''), map(this.filter.bind(this)));
      this.control.valueChanges.subscribe((value) => {
        this.selectedId.emit(value);
      });
      this.control.setValue(this.initialValue);
    });
  }

  filter(value: string): string[] {
    if (!value) {
      return this.ids;
    }

    return _.filter(this.ids, (id) => _
      .includes(id.toLowerCase(), value.toLowerCase()));
  }

  isDisabled(id) {
    return _.includes(this.disabledIds, id);
  }

  writeValue(value: string) {
    if (value === null) {
      this.control.reset();
      this.control.markAsUntouched();
      this.control.markAsPristine();
    } else {
      this.control.setValue(value);
    }
  }

  registerOnChange(fn: (value: string) => void) {
    this.selectedId.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    if (this.control.pristine) {
      return null;
    }

    return this.control.errors;
  }
}
