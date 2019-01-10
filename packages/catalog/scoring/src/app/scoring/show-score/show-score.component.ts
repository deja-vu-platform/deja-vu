import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnInit, OnChanges
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { API_PATH } from '../scoring.config';
import { Score } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-score',
  templateUrl: './show-score.component.html',
  styleUrls: ['./show-score.component.css']
})
export class ShowScoreComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  @Input() id: string;
  @Input() score: Score;

  @Input() showId = true;
  @Input() showValue = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;

  @Input() noValueText = 'No value';
  @Input() noSourceIdText = 'No source id';
  @Input() noTargetIdText = 'No target id';

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.loadScore();
  }

  ngOnChanges() {
    this.loadScore();
  }

  loadScore() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<{data: {score: Score}}>(this.apiPath, {
        params: {
          variables: { id: this.id },
          extraInfo: {
            returnFields: `
                ${this.showId ? 'id' : ''}
                ${this.showValue ? 'value' : ''}
                ${this.showSourceId ? 'sourceId' : ''}
                ${this.showTargetId ? 'targetId' : ''}
            `
          }
        }
      })
      .subscribe((res) => {
        this.score = res.data.score;
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.score && this.id);
  }
}
