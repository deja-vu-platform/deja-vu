import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnInit, OnChanges, Type
} from '@angular/core';

import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { ShowTargetComponent } from '../show-target/show-target.component';

import { API_PATH } from '../scoring.config';
import { Target } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-targets-by-score',
  templateUrl: './show-targets-by-score.component.html',
  styleUrls: ['./show-targets-by-score.component.css']
})
export class ShowTargetsByScoreComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  @Input() targets: Target[];
  @Input() showAscending = true;

  @Input() showId = true;
  @Input() showScores = true;
  @Input() showTotal = true;
  @Input() showScoreId = true;
  @Input() showScoreValue = true;
  @Input() showScoreSourceId = true;
  @Input() showScoreTargetId = true;

  @Input() totalLabel = 'Total: ';
  @Input() noScoresText = 'No scores to show';
  @Input() noTargetsText = 'No targets to show';

  @Input() showTarget: Action = {
    type: <Type<Component>> ShowTargetComponent
  };

  showTargetsByScore;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showTargetsByScore = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
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
      this.gs.get<{data: {targetsByScore: Target[]}}>(this.apiPath, {
        params: {
          query: `
            query {
              targetsByScore(asc: ${this.showAscending}) {
                id
                ${this.showScores ? 'scores ' +
                  '{' +
                    'id \n' +
                    `${this.showScoreValue ? 'value \n' : ''}` +
                    `${this.showScoreSourceId ? 'sourceId \n' : ''}` +
                    `${this.showScoreTargetId ? 'targetId \n' : ''}` +
                  '}' : ''
                }
                ${this.showTotal ? 'total': ''}
              }
            }
          `
        }
      })
      .subscribe((res) => {
        this.targets = res.data.targetsByScore;
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && !this.targets);
  }
}
