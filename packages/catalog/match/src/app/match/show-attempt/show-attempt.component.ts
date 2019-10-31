import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../match.config';
import { Attempt } from '../shared/match.model';


interface AttemptRes {
  data: { attempt: Attempt };
}

@Component({
  selector: 'match-show-attempt',
  templateUrl: './show-attempt.component.html'
})
export class ShowAttemptComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  // Provide one of the following: id or attempt
  @Input() id: string | undefined;
  @Input() attempt: Attempt | undefined;
  @Output() loadedAttempt = new EventEmitter();

  @Input() showId = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

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
      const res = await this.dvs.get<AttemptRes>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showSourceId ? 'sourceId' : ''}
              ${this.showTargetId ? 'targetId' : ''}
            `
          }
        }
      });
      this.attempt = res.data.attempt;
      this.loadedAttempt.emit(this.attempt);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.attempt && this.id && this.dvs);
  }
}
