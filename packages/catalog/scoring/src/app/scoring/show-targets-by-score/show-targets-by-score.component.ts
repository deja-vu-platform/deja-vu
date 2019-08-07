import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnDestroy, OnInit, Output, Type
} from '@angular/core';

import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';

import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { ShowScoreComponent } from '../show-score/show-score.component';
import { ShowTargetComponent } from '../show-target/show-target.component';

import { API_PATH } from '../scoring.config';
import { Target } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-targets-by-score',
  templateUrl: './show-targets-by-score.component.html',
  styleUrls: ['./show-targets-by-score.component.css']
})
export class ShowTargetsByScoreComponent implements AfterViewInit, OnEval,
  OnInit, OnChanges, OnDestroy {
  @Input() sourceId: string | undefined;
  @Input() targetIds: string[] | undefined;

  @Input() targets: Target[];

  @Input() showAscending = true;

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
  @Input() noTargetsText = 'No targets to show';

  @Input() showScore: Action = {
    type: <Type<Component>> ShowScoreComponent
  };
  @Input() showTarget: Action = {
    type: <Type<Component>> ShowTargetComponent
  };

  @Output() loadedTargets = new EventEmitter<Target[]>();

  showTargetsByScore;
  loaded = false;
  private gs: GatewayService;

  private destroyed = new Subject<any>();
  private shouldReload = false;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private router: Router,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showTargetsByScore = this;
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
    this.loadTargets();
  }

  ngOnChanges() {
    this.loadTargets();
  }

  loadTargets() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<{ data: { targetsByScore: Target[] } }>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              asc: this.showAscending,
              targetIds: this.targetIds,
              sourceId: this.sourceId
            }
          }),
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
          this.targets = res.data.targetsByScore;
          this.loadedTargets.emit(this.targets);
          this.shouldReload = false;
          this.loaded = true;
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs && (!this.targets || this.shouldReload));
  }
}
