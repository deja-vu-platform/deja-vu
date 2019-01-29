import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  OnChanges,
  Output,
  Type
} from '@angular/core';

import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { ShowTargetComponent } from '../show-target/show-target.component';

import { API_PATH } from '../ranking.config';
import { Ranking, Target } from '../shared/ranking.model';


@Component({
  selector: 'ranking-show-ranking',
  templateUrl: './show-ranking.component.html',
  styleUrls: ['./show-ranking.component.css']
})
export class ShowRankingComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  @Input() id: string;

  @Input() showId = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;
  @Input() showTargetRank = true;
  @Output() ranking = new EventEmitter<Ranking[]>();

  @Input() targetRankLabel = 'Rank: ';
  @Input() noTargetsText = 'No targets';

  @Input() showTarget: Action = {
    type: <Type<Component>> ShowTargetComponent
  };

  sourceId: string;
  targets: Target[];
  showRanking;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showRanking = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.loadRanking();
  }

  ngOnChanges() {
    this.loadRanking();
  }

  loadRanking() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<{data: {ranking: Ranking[]}}>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showSourceId ? 'sourceId' : ''}
              ${this.showTargetId ? 'targetId' : ''}
              ${this.showTargetRank ? 'rank' : ''}
            `
          }
        }
      })
      .subscribe((res) => {
        const ranking = res.data.ranking;
        this.targets = ranking.map((ranking: Ranking) => {
          return {
            id: ranking.targetId,
            rank: ranking.rank
          }
        });
        if (ranking.length > 0) {
          this.sourceId = ranking[0].sourceId;
        }
        this.ranking.emit(ranking);
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.id);
  }
}
