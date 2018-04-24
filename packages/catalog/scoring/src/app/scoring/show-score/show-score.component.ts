import { Component, ElementRef, Input, OnInit, OnChanges } from '@angular/core';

import { GatewayService, GatewayServiceFactory } from 'dv-core';

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

  @Input() noValueText = 'No value';

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {}

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
    this.gs.get<{data: {score: Score}}>('/graphql', {
      params: {
        query: `
          query {
            score(id: "${this.id}") {
              ${this.showId ? 'id' : ''}
              ${this.showValue ? 'value' : ''}
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
