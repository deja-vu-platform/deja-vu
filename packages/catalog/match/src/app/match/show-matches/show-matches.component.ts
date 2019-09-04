import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, SimpleChanges, Type
} from '@angular/core';

import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../match.config';
import { Match } from '../shared/match.model';
import { ShowMatchComponent } from '../show-match/show-match.component';

interface MatchesRes {
  data: { matches: Match[] };
}

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'match-show-matches',
  templateUrl: './show-matches.component.html'
})
export class ShowMatchesComponent implements AfterViewInit, OnChanges, OnEval,
  OnInit {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
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

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {
    this.showMatches = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field] && !_.isNil(changes[field].currentValue)) {
        this.fieldChange.emit(field);
      }
    }
    // We should only reload iif what changed is something we are not
    // waiting on (because if ow we would send a double request)
    let shouldLoad = false;
    for (const fieldThatChanged of _.keys(changes)) {
      if (!this.activeWaits.has(fieldThatChanged)) {
        shouldLoad = true;
      }
    }
    if (shouldLoad) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (!_.isEmpty(this.waitOn)) {
        await Promise.all(_.chain(this.waitOn)
          .filter((field) => _.isNil(this[field]))
          .tap((fs) => {
            this.activeWaits = new Set(fs);

            return fs;
          })
          .map((fieldToWaitFor) => this.fieldChange
            .pipe(filter((field) => field === fieldToWaitFor), take(1))
            .toPromise())
          .value());
      }
      this.gs.get<MatchesRes>(this.apiPath, {
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
      })
        .pipe(map((res: MatchesRes) => res.data.matches))
        .subscribe((matches) => {
          this.matches = matches;
          this.loadedMatches.emit(matches);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
