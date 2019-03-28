import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { API_PATH } from '../scoring.config';
import { Score } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-score',
  templateUrl: './show-score.component.html',
  styleUrls: ['./show-score.component.css']
})
export class ShowScoreComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  @Input() id: string | undefined;
  @Input() sourceId: string | undefined;
  @Input() targetId: string | undefined;
  @Input() score: Score;

  @Input() showId = true;
  @Input() showValue = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;

  @Input() noValueText = 'No value';
  @Input() noSourceIdText = 'No source id';
  @Input() noTargetIdText = 'No target id';

  @Output() loadedScore = new EventEmitter();

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

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
      this.gs.get<{ data: { score: Score } }>(this.apiPath, {
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
                ${this.showValue ? 'value' : ''}
                ${this.showSourceId ? 'sourceId' : ''}
                ${this.showTargetId ? 'targetId' : ''}
            `
          }
        }
      })
        .subscribe((res) => {
          this.score = res.data.score;
          this.loadedScore.emit(this.score);
        });
    }
  }

  private canEval(): boolean {
    const hasRightInputs = !!(this.id || (this.sourceId && this.targetId));

    return this.gs && !this.score && hasRightInputs;
  }
}
