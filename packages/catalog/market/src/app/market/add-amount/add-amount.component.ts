import {
  Component, ElementRef, Input, OnInit, Type, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-add-amount',
  templateUrl: './add-amount.component.html',
  styleUrls: ['./add-amount.component.css']
})
export class AddAmountComponent implements OnInit, OnRun, OnAfterAbort,
  OnAfterCommit {
  @Input() partyId: string;

  // Presentation input
  @Input() inputLabel: string = 'Amount to Add';
  @Input() buttonLabel: string = 'Add';

  @ViewChild(FormGroupDirective) form;

  balance = new FormControl('');
  addAmountForm: FormGroup = this.builder.group({
    balance: this.balance
  });


  addAmountSaved = false;
  addAmountError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{data: any}>('/graphql', {
      query: `mutation AddAmount($input: AddAmountInput!) {
        addAmount(input: $input)
      }`,
      variables: {
        input: {
          partyId: this.partyId,
          amount: this.balance.value
        }
      }
    })
    .toPromise();
  }
  
  dvOnAfterCommit() {
    this.addAmountSaved = true;
    this.addAmountError = '';
    window.setTimeout(() => {
      this.addAmountSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(res: any, reason: Error) {
    this.addAmountError = reason.message;
  }
}
