import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../match.config';
import { Attempt } from '../shared/match.model';

interface AttemptRes {
  data: { attempt: Attempt };
}


@Component({
  selector: 'match-show-attempt',
  templateUrl: './show-attempt.component.html'
})
export class ShowAttemptComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or attempt
  @Input() id: string | undefined;
  @Input() attempt: Attempt | undefined;
  @Output() loadedAttempt = new EventEmitter();

  @Input() showId = true;
  @Input() showSourceId = true;
  @Input() showTargetId = true;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {}

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
      this.gs.get<AttemptRes>(this.apiPath, {
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
      })
      .pipe(map((res: AttemptRes) => res.data.attempt))
      .subscribe((attempt) => {
        this.attempt = attempt;
        this.loadedAttempt.emit(attempt);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.attempt && this.id && this.gs);
  }
}
