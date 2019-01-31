import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnInit, OnChanges, Type
} from '@angular/core';

import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { ShowTargetComponent } from '../show-target/show-target.component';

import { API_PATH } from '../ranking.config';
import { Ranking, TargetRank } from '../shared/ranking.model';


@Component({
  selector: 'ranking-show-target-rankings',
  templateUrl: './show-target-rankings.component.html',
  styleUrls: ['./show-target-rankings.component.css']
})
export class ShowTargetRankingsComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  @Input() targetIds: string[];

  @Input() showTargetId = true;
  @Input() showTargetRank = true;

  @Input() targetRankLabel = 'Rank: ';
  @Input() noTargetsText = 'No targets';

  @Input() showTarget: Action = {
    type: <Type<Component>> ShowTargetComponent
  };

  targets: TargetRank[];
  showTargetRankings;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showTargetRankings = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.loadTargetRankings();
  }

  ngOnChanges() {
    this.loadTargetRankings();
  }

  loadTargetRankings() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<{data: {targetRankingsByAvg: TargetRank[]}}>(this.apiPath, {
        params: {
          inputs: {
            targetIds: this.targetIds
          },
          extraInfo: {
            returnFields: `
              ${this.showTargetId ? 'id' : ''}
              ${this.showTargetRank ? 'rank' : ''}
            `
          }
        }
      })
      .subscribe((res) => {
        this.targets = res.data.targetRankingsByAvg;
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.targetIds);
  }
}
