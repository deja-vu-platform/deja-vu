import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../match.config';
import { Attempts } from '../shared/match.model';

interface AttemptsRes {
  data: { attempts: Attempts };
}


@Component({
  selector: 'match-show-attempts',
  templateUrl: './show-attempts.component.html'
})
export class ShowAttemptsComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or attempts
  @Input() id: string | undefined;
  @Input() attempts: Attempts | undefined;
  @Output() loadedAttempts = new EventEmitter();

  @Input() showId = true;
  @Input() showContent = true;

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
      this.gs.get<AttemptsRes>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showContent ? 'content' : ''}
            `
          }
        },
      })
      .pipe(map((res: AttemptsRes) => res.data.attempts))
      .subscribe((attempts) => {
        this.attempts = attempts;
        this.loadedAttempts.emit(attempts);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.attempts && this.id && this.gs);
  }
}
