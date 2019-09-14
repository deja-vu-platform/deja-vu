import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy,
  OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { API_PATH } from '../match.config';
import { Attempt } from '../shared/match.model';
import { ShowAttemptComponent } from '../show-attempt/show-attempt.component';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import * as _ from 'lodash';
import { filter, map, take, takeUntil } from 'rxjs/operators';


interface AttemptsRes {
  data: { attempts: Attempt[] };
}

@Component({
  selector: 'match-show-attempts',
  templateUrl: './show-attempts.component.html'
})
export class ShowAttemptsComponent implements
  AfterViewInit, OnChanges, OnEval, OnInit, OnDestroy {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
  // Provide at most one of the following: sourceId or targetId
  @Input() sourceId: string | undefined;
  @Input() targetId: string | undefined;
  @Output() loadedAttempts = new EventEmitter<Attempt[]>();

  @Input() showId = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;

  @Input() showAttempt: ComponentValue = {
    type: <Type<Component>> ShowAttemptComponent
  };
  @Input() noAttemptsToShowText = 'No attempts to show';
  attempts: Attempt[] = [];

  showAttempts;

  destroyed = new Subject<any>();
  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    private router: Router,
    @Inject(API_PATH) private apiPath) {
    this.showAttempts = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.destroyed))
      .subscribe(() => {
        this.load();
      });
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
      this.gs.get<AttemptsRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              sourceId: this.sourceId,
              targetId: this.targetId
            }
          }),
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showSourceId ? 'sourceId' : ''}
              ${this.showTargetId ? 'targetId' : ''}
            `
          }
        }
      })
        .pipe(map((res: AttemptsRes) => res.data.attempts))
        .subscribe((attempts) => {
          this.attempts = attempts;
          this.loadedAttempts.emit(attempts);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
