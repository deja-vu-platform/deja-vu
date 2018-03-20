import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import { Market } from '../shared/market.model';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-create-market',
  templateUrl: './create-market.component.html',
  styleUrls: ['./create-market.component.css']
})
export class CreateMarketComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string = ''; // optional
  @Output() market: EventEmitter<Market> = new EventEmitter<Market>();

  // Presentation inputs
  @Input() buttonLabel = 'Create Market';
  @Input() inputLabel = 'Id';
  @Input() newMarketSavedText = 'New market saved';

  newMarketSaved = false;
  newMarketError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{
      data: { createMarket: { id: string }}
    }>('/graphql', {
      query: `mutation {
        createMarket(id: "${this.id}") {
          id
        }
      }`,
      variables: {
        input: {
          id: this.id
        }
      }
    })
    .toPromise();
    this.market.emit({ id: res.data.createMarket.id });
  }

  dvOnAfterCommit() {
    this.newMarketSaved = true;
    this.newMarketError = '';
    window.setTimeout(() => {
      this.newMarketSaved = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.newMarketError = reason.message;
  }
}
