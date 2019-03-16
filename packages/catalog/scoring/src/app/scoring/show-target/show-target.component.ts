import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnInit, Output, Type
} from '@angular/core';

import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { ShowScoreComponent } from '../show-score/show-score.component';

import { API_PATH } from '../scoring.config';
import { Target } from '../shared/scoring.model';


@Component({
  selector: 'scoring-show-target',
  templateUrl: './show-target.component.html',
  styleUrls: ['./show-target.component.css']
})
export class ShowTargetComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  @Input() id: string;
  @Input() target: Target;
  @Input() index: number;

  @Input() showId = true;
  @Input() showScores = true;
  @Input() showTotal = true;
  @Input() showScoreId = true;
  @Input() showScoreValue = true;
  @Input() showScoreSourceId = true;
  @Input() showScoreTargetId = true;
  @Input() showIndex = false;

  @Input() totalLabel = 'Total: ';
  @Input() noScoresText = 'No scores to show';

  @Input() showScore: Action = {
    type: <Type<Component>>ShowScoreComponent
  };

  @Output() loadedTarget = new EventEmitter<Target>();

  showTarget;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showTarget = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.loadTarget();
  }

  ngOnChanges() {
    this.loadTarget();
  }

  loadTarget() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<{ data: { target: Target } }>(this.apiPath, {
        params: {
          inputs: { id: this.id },
          extraInfo: {
            returnFields: `
                id
                ${this.showScores ? 'scores ' +
                  '{' +
                    'id \n' +
                    `${this.showScoreValue ? 'value \n' : ''}` +
                    `${this.showScoreSourceId ? 'sourceId \n' : ''}` +
                    `${this.showScoreTargetId ? 'targetId \n' : ''}` +
                  '}' : ''
                 }
                ${this.showTotal ? 'total' : ''}
            `
          }
        }
      })
        .subscribe((res) => {
          this.target = res.data.target;
          this.loadedTarget.emit(this.target);
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.id && !this.target);
  }
}
