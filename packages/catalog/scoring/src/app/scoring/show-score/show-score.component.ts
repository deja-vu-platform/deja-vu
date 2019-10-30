import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output
} from '@angular/core';

import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../scoring.config';
import { Score } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-score',
  templateUrl: './show-score.component.html',
  styleUrls: ['./show-score.component.css']
})
export class ShowScoreComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges, OnDestroy {
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

  private dvs: DvService;

  private shouldReload = false;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
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

  ngOnChanges(changes) {
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
      const res = await this.dvs
        .waitAndGet<{ data: { score: Score }, errors: any }>(
          this.apiPath, () => ({
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
          }));
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
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return this.dvs && (!this.score || this.shouldReload);
  }
}
