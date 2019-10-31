import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { ShowRankingComponent } from '../show-ranking/show-ranking.component';
import { ShowTargetComponent } from '../show-target/show-target.component';

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

  @Input() showTarget: ComponentValue = {
    type: <Type<Component>> ShowTargetComponent
  };
  @Input() showRanking: ComponentValue = {
    type: <Type<Component>> ShowRankingComponent
  };

  rankings: Ranking[];
  showRankings;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {
    this.showRankings = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.loadRanking();
  }

  ngOnChanges() {
    this.loadRanking();
  }

  loadRanking() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<{data: {rankings: Ranking[]}}>(
        this.apiPath, {
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
        });
      if (res.data) {
        this.rankings = res.data.rankings;
        this.loadedRankings.emit(this.rankings);
      }
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs && (this.id || this.sourceId || this.targetId));
  }
}
