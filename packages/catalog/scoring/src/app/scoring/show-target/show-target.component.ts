import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';

import { filter, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { ShowScoreComponent } from '../show-score/show-score.component';

import { API_PATH } from '../scoring.config';
import { Target } from '../shared/scoring.model';

import * as _ from 'lodash';


@Component({
  selector: 'scoring-show-target',
  templateUrl: './show-target.component.html',
  styleUrls: ['./show-target.component.css']
})
export class ShowTargetComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges, OnDestroy {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
  @Input() id: string | undefined;
  @Input() sourceId: string | undefined;
  @Input() target: Target | undefined;
  @Input() index: number;

  @Input() showId = true;
  @Input() showScores = true;
  @Input() showTotal = true;
  @Input() showScoreId = true;
  @Input() showScoreValue = true;
  @Input() showScoreSourceId = true;
  @Input() showScoreTargetId = true;
  @Input() showIndex = false;

  @Input() totalLabel = 'Total: ';
  @Input() noScoresText = 'No scores to show';

  @Input() showScore: ComponentValue = {
    type: <Type<Component>> ShowScoreComponent
  };

  @Output() loadedTarget = new EventEmitter<Target>();

  showTarget;
  private gs: GatewayService;

  private destroyed = new Subject<any>();
  private shouldReload = false;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private router: Router,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showTarget = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);

    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.destroyed))
      .subscribe(() => {
        this.shouldReload = true;
        this.rs.eval(this.elem);
      });
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
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
      this.gs.get<{ data: { target: Target } }>(this.apiPath, {
        params: {
          inputs: {
            input: {
              id: this.id,
              sourceId: this.sourceId
            }
          },
          extraInfo: {
            returnFields: `
                id
                ${this.showScores ? 'scores ' +
                '{' +
                'id \n' +
                `${this.showScoreValue ? 'value \n' : ''}` +
                `${this.showScoreSourceId ? 'sourceId \n' : ''}` +
                `${this.showScoreTargetId ? 'targetId \n' : ''}` +
                '}' : ''
              }
                ${this.showTotal ? 'total' : ''}
            `
          }
        }
      })
        .subscribe((res) => {
          this.target = res.data.target;
          this.loadedTarget.emit(this.target);
          this.shouldReload = false;
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.id && (!this.target || this.shouldReload));
  }
}
