import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { ShowTargetComponent } from '../show-target/show-target.component';

import { API_PATH } from '../ranking.config';
import { TargetRank } from '../shared/ranking.model';


@Component({
  selector: 'ranking-show-fractional-ranking',
  templateUrl: './show-fractional-ranking.component.html',
  styleUrls: ['./show-fractional-ranking.component.css']
})
export class ShowFractionalRankingComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  @Input() waitOn: string[];
  @Input() targetIds: string[];

  @Input() showTargetId = true;
  @Input() showTargetRank = true;

  @Input() targetRankLabel = 'Rank: ';
  @Input() noTargetsText = 'No targets';

  @Input() showTarget: ComponentValue = {
    type: <Type<Component>> ShowTargetComponent
  };

  targets: TargetRank[];
  showTargetRankings;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {
    this.showTargetRankings = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
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
        .waitAndGet<{data: {fractionalRanking: TargetRank[]}}>(
          this.apiPath,
          () => ({
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
          }));
      this.targets = res.data.fractionalRanking;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!this.dvs;
  }
}
