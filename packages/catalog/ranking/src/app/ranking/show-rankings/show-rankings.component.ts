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
} from '@deja-vu/core';

import { ShowTargetComponent } from '../show-target/show-target.component';
import { ShowRankingComponent } from '../show-ranking/show-ranking.component';

import { API_PATH } from '../ranking.config';
import { Ranking, TargetRank } from '../shared/ranking.model';


@Component({
  selector: 'ranking-show-rankings',
  templateUrl: './show-rankings.component.html',
  styleUrls: ['./show-rankings.component.css']
})
export class ShowRankingsComponent
implements AfterViewInit, OnEval, OnInit, OnChanges {
  @Input() id: string | undefined;
  @Input() sourceId: string | undefined;
  @Input() targetId: string | undefined;

  @Input() showId = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;
  @Input() showTargetRank = true;
  @Output() loadedRankings = new EventEmitter<Ranking[]>();

  @Input() targetRankLabel = 'Rank: ';
  @Input() noTargetsText = 'No targets';
  @Input() noRankingsText = 'No rankings';

  @Input() showTarget: Action = {
    type: <Type<Component>> ShowTargetComponent
  };
  @Input() showRanking: Action = {
    type: <Type<Component>> ShowRankingComponent
  };

  rankings: Ranking[];
  showRankings;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showRankings = this;
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
      this.gs.get<{data: {rankings: Ranking[]}}>(this.apiPath, {
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
              ${this.showSourceId ? 'sourceId' : ''}
              ${this.showTargetId || this.showTargetRank ?
                `targets {
                  ${this.showTargetId ? 'id' : ''}
                  ${this.showTargetRank ? 'rank' : ''}
                }` : ''
              }
            `
          }
        }
      })
      .subscribe((res) => {
        if (res.data) {
          this.rankings = res.data.rankings;
          this.loadedRankings.emit(this.rankings);
        }
      });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs && (this.id || this.sourceId || this.targetId));
  }
}
