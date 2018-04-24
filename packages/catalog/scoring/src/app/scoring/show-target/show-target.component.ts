import {
  Component, ElementRef, Input, OnInit, OnChanges, Type
} from '@angular/core';

import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';

import { ShowScoreComponent } from '../show-score/show-score.component';

import { Target } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-target',
  templateUrl: './show-target.component.html',
  styleUrls: ['./show-target.component.css']
})
export class ShowTargetComponent implements OnInit, OnChanges {
  @Input() id: string;
  @Input() target: Target;

  @Input() showId = true;
  @Input() showScores = true;
  @Input() showTotal = true;
  @Input() showScoreId = true;
  @Input() showScoreValue = true;

  @Input() totalLabel = 'Total: ';
  @Input() noScoresText = 'No scores to show';

  @Input() showScore: Action = {
    type: <Type<Component>> ShowScoreComponent
  };

  showTarget;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showTarget = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadTarget();
  }

  ngOnChanges() {
    this.loadTarget();
  }

  loadTarget() {
    // only load target when id is given
    if (!this.gs || this.target || !this.id) {
      return;
    }
    this.gs.get<{data: {target: Target}}>('/graphql', {
      params: {
        query: `
          query {
            target(id: "${this.id}") {
              ${this.showId ? 'id' : ''}
              ${this.showScores ? 'scores { id }' : ''}
              ${this.showTotal ? 'total': ''}
            }
          }
        `
      }
    })
    .subscribe((res) => {
      this.target = res.data.target;
    });
  }
}
