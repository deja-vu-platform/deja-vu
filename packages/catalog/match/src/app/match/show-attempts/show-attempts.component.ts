import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { API_PATH } from '../match.config';
import { Attempt } from '../shared/match.model';
import { ShowAttemptComponent } from '../show-attempt/show-attempt.component';

import * as _ from 'lodash';


interface AttemptsRes {
  data: { attempts: Attempt[] };
}

@Component({
  selector: 'match-show-attempts',
  templateUrl: './show-attempts.component.html'
})
export class ShowAttemptsComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit, OnDestroy {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
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

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {
    this.showAttempts = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => { this.load(); })
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
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
      const res = await this.dvs.waitAndGet<AttemptsRes>(this.apiPath, () => ({
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
      }));
      this.attempts = res.data.attempts;
      this.loadedAttempts.emit(this.attempts);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
