import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../match.config';
import { Attempt } from '../shared/match.model';
import { ShowAttemptComponent } from '../show-attempt/show-attempt.component';

interface AttemptsRes {
  data: { attempts: Attempt[] };
}


@Component({
  selector: 'match-show-attempts',
  templateUrl: './show-attempts.component.html'
})
export class ShowAttemptsComponent implements AfterViewInit, OnChanges, OnEval,
  OnInit {
  // Provide at most one of the following: sourceId or targetId
  @Input() sourceId: string | undefined;
  @Input() targetId: string | undefined;
  @Output() loadedAttempts = new EventEmitter<Attempt[]>();

  @Input() showId = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;

  @Input() showAttempt: ComponentValue = {
    type: <Type<Component>> ShowAttemptComponent
  };
  @Input() noAttemptsToShowText = 'No attempts to show';
  attempts: Attempt[] = [];

  showAttempts;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {
    this.showAttempts = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<AttemptsRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              sourceId: this.sourceId,
              targetId: this.targetId
            }
          }),
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showSourceId ? 'sourceId' : ''}
              ${this.showTargetId ? 'targetId' : ''}
            `
          }
        }
      })
        .pipe(map((res: AttemptsRes) => res.data.attempts))
        .subscribe((attempts) => {
          this.attempts = attempts;
          this.loadedAttempts.emit(attempts);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
