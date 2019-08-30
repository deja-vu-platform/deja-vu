import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../match.config';
import { Match } from '../shared/match.model';

interface ShowMatchRes {
  data: { match: Match };
}

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'match-show-match',
  templateUrl: './show-match.component.html'
})
export class ShowMatchComponent implements AfterViewInit, OnChanges, OnEval,
  OnInit {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
  // Provide one of the following: id, (userAId and userBId) or match
  @Input() id: string | undefined;
  @Input() userAId: string | undefined;
  @Input() userBId: string | undefined;
  @Input() match: Match | undefined;
  @Output() loadedMatch = new EventEmitter();

  @Input() showId = true;
  @Input() showUserIds = true;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

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
      this.gs.get<ShowMatchRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              id: this.id,
              userAId: this.userAId,
              userBId: this.userBId
            }
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
        .pipe(map((res: ShowMatchRes) => res.data.match))
        .subscribe((match) => {
          this.match = match;
          this.loadedMatch.emit(match);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.match &&
      (this.id || (this.userAId && this.userBId)) &&
      this.gs);
  }
}
