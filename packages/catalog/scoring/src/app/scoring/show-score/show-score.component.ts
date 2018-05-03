import {
  Component, ElementRef, Inject, Input, OnInit, OnChanges
} from '@angular/core';

import { GatewayService, GatewayServiceFactory } from 'dv-core';

import { API_PATH } from '../scoring.config';
import { Score } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-score',
  templateUrl: './show-score.component.html',
  styleUrls: ['./show-score.component.css']
})
export class ShowScoreComponent implements OnInit, OnChanges {
  @Input() id: string;
  @Input() score: Score;

  @Input() showId = true;
  @Input() showValue = true;
  @Input() showTargetId = true;

  @Input() noValueText = 'No value';
  @Input() noTargetIdText = 'No target id';

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadScore();
  }

  ngOnChanges() {
    this.loadScore();
  }

  loadScore() {
    // only load score when id is given
    if (!this.gs || this.score || !this.id) {
      return;
    }
    this.gs.get<{data: {score: Score}}>(this.apiPath, {
      params: {
        query: `
          query {
            score(id: "${this.id}") {
              ${this.showId ? 'id' : ''}
              ${this.showValue ? 'value' : ''}
              ${this.showTargetId ? 'targetId' : ''}
            }
          }
        `
      }
    })
    .subscribe((res) => {
      this.score = res.data.score;
    });
  }
}
