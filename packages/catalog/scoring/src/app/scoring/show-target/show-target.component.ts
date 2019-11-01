import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
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
export class ShowTargetComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges, OnDestroy {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
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
  private dvs: DvService;

  private shouldReload = false;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {
    this.showTarget = this;
  }

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
      const res = await this.dvs.waitAndGet<{ data: { target: Target } }>(
        this.apiPath, () => ({
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
        }));
        this.target = res.data.target;
        this.loadedTarget.emit(this.target);
        this.shouldReload = false;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs && this.id && (!this.target || this.shouldReload));
  }
}
