import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, SimpleChanges, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { API_PATH } from '../match.config';
import { Match } from '../shared/match.model';
import { ShowMatchComponent } from '../show-match/show-match.component';

import * as _ from 'lodash';


interface MatchesRes {
  data: { matches: Match[] };
}

@Component({
  selector: 'match-show-matches',
  templateUrl: './show-matches.component.html'
})
export class ShowMatchesComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  @Input() userId: string | undefined;
  @Output() loadedMatches = new EventEmitter<Match[]>();

  @Input() showId = true;
  @Input() showUserIds = true;

  @Input() showMatch: ComponentValue = {
    type: <Type<Component>> ShowMatchComponent
  };
  @Input() noMatchesToShowText = 'No matches to show';
  matches: Match[] = [];

  showMatches;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {
    this.showMatches = this;
  }

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
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<MatchesRes>(this.apiPath, () => ({
        params: {
          inputs: JSON.stringify({
            input: { userId: this.userId }
          }),
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showUserIds ? 'userAId' : ''}
              ${this.showUserIds ? 'userBId' : ''}
            `
          }
        }
      }));
      this.matches = res.data.matches;
      this.loadedMatches.emit(this.matches);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
