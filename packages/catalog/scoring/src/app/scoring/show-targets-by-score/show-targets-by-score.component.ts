import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnDestroy, OnInit, Output, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { ShowScoreComponent } from '../show-score/show-score.component';
import { ShowTargetComponent } from '../show-target/show-target.component';

import { API_PATH } from '../scoring.config';
import { Target } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-targets-by-score',
  templateUrl: './show-targets-by-score.component.html',
  styleUrls: ['./show-targets-by-score.component.css']
})
export class ShowTargetsByScoreComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges, OnDestroy {
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

  @Input() showScore: ComponentValue = {
    type: <Type<Component>> ShowScoreComponent
  };
  @Input() showTarget: ComponentValue = {
    type: <Type<Component>> ShowTargetComponent
  };

  @Output() loadedTargets = new EventEmitter<Target[]>();

  showTargetsByScore;
  loaded = false;
  private dvs: DvService;

  private shouldReload = false;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {
    this.showTargetsByScore = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withRefreshCallback(() => {
        this.shouldReload = true;
        this.dvs.eval();
      })
      .build();
  }

  ngOnDestroy() {
    this.dvs.onDestroy();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<{ data: { targetsByScore: Target[] } }>(
        this.apiPath, {
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
        });
      this.targets = res.data.targetsByScore;
      this.loadedTargets.emit(this.targets);
      this.shouldReload = false;
      this.loaded = true;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs && (!this.targets || this.shouldReload));
  }
}
