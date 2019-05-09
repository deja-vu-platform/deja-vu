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

import { API_PATH } from '../ranking.config';
import { Ranking, TargetRank } from '../shared/ranking.model';


@Component({
  selector: 'ranking-show-ranking',
  templateUrl: './show-ranking.component.html',
  styleUrls: ['./show-ranking.component.css']
})
export class ShowRankingComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
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

  @Input() showTarget: Action = {
    type: <Type<Component>> ShowTargetComponent
  };

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
      this.gs.get<{data: {ranking: Ranking}}>(this.apiPath, {
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
      })
      .subscribe((res) => {
        if (res.data) {
          this.ranking = res.data.ranking;
          this.loadedRanking.emit(this.ranking);
        }
      });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.ranking && this.gs && this.id);
  }
}
