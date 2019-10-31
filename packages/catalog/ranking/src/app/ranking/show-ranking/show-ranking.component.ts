import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { ShowTargetComponent } from '../show-target/show-target.component';

import { API_PATH } from '../ranking.config';
import { Ranking, TargetRank } from '../shared/ranking.model';


@Component({
  selector: 'ranking-show-ranking',
  templateUrl: './show-ranking.component.html',
  styleUrls: ['./show-ranking.component.css']
})
export class ShowRankingComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  @Input() id: string;
  @Input() sourceId: string | undefined;
  @Input() ranking: Ranking;

  @Input() showId = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;
  @Input() showTargetRank = true;
  @Output() loadedRanking = new EventEmitter<Ranking>();

  @Input() targetRankLabel = 'Rank: ';
  @Input() noTargetsText = 'No targets';

  @Input() showTarget: ComponentValue = {
    type: <Type<Component>> ShowTargetComponent
  };

  showRanking;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showRanking = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
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
      const res = await this.dvs.get<{data: {ranking: Ranking}}>(this.apiPath, {
        params: {
          inputs: {
            id: this.id,
            sourceId: this.sourceId
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
        this.ranking = res.data.ranking;
        this.loadedRanking.emit(this.ranking);
      }
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.ranking && this.dvs && this.id);
  }
}
