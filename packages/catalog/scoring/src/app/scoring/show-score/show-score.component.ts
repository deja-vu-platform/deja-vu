import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, RunService,
  WaiterService, WaiterServiceFactory
} from '@deja-vu/core';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';

import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import * as _ from 'lodash';

import { API_PATH } from '../scoring.config';
import { Score } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-score',
  templateUrl: './show-score.component.html',
  styleUrls: ['./show-score.component.css']
})
export class ShowScoreComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges, OnDestroy {
  @Input() waitOn: string[];
  @Input() id: string | undefined;
  @Input() sourceId: string | undefined;
  @Input() targetId: string | undefined;
  @Input() score: Score;

  @Input() showId = true;
  @Input() showValue = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;

  @Input() noValueText = 'No value';
  @Input() noSourceIdText = 'No source id';
  @Input() noTargetIdText = 'No target id';

  @Output() loadedScore = new EventEmitter();
  @Output() errors = new EventEmitter<any>();

  private gs: GatewayService;
  private ws: WaiterService;

  private destroyed = new Subject<any>();
  private shouldReload = false;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory, private router: Router,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.ws = this.wsf.for(this, this.waitOn);
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

  ngOnChanges(changes) {
    if (this.ws && this.ws.processChanges(changes)) {
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
      await this.ws.maybeWait();
      this.gs.get<{ data: { score: Score }, errors: any }>(this.apiPath, {
        params: {
          inputs: {
            input: {
              id: this.id,
              sourceId: this.sourceId,
              targetId: this.targetId
            }
          },
          extraInfo: {
            returnFields: `
                ${this.showId ? 'id' : ''}
                ${this.showValue ? 'value' : ''}
                ${this.showSourceId ? 'sourceId' : ''}
                ${this.showTargetId ? 'targetId' : ''}
            `
          }
        }
      })
        .subscribe((res) => {
          if (!_.isEmpty(res.errors)) {
            this.score = null;
            this.loadedScore.emit(null);
            this.errors.emit(res.errors);
          } else {
            this.score = res.data.score;
            this.loadedScore.emit(this.score);
            this.errors.emit(null);
          }
          this.shouldReload = false;
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return this.gs && (!this.score || this.shouldReload);
  }
}
