import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../match.config';
import { Match } from '../shared/match.model';
import { ShowMatchComponent } from '../show-match/show-match.component';

interface MatchesRes {
  data: { matches: Match[] };
}


@Component({
  selector: 'match-show-matches',
  templateUrl: './show-matches.component.html'
})
export class ShowMatchesComponent implements AfterViewInit, OnChanges, OnEval,
  OnInit {
  @Input() userId: string | undefined;
  @Output() loadedMatches = new EventEmitter<Match[]>();

  @Input() showId = true;
  @Input() showUserIds = true;

  @Input() showMatch: Action = {
    type: <Type<Component>> ShowMatchComponent
  };
  @Input() noMatchesToShowText = 'No matches to show';
  matches: Match[] = [];

  showMatches;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {
    this.showMatches = this;
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
      this.gs.get<MatchesRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: { userId: this.userId }
          }),
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showUserIds ? 'userIds' : ''}
            `
          }
        }
      })
        .pipe(map((res: MatchesRes) => res.data.matches))
        .subscribe((matches) => {
          this.matches = matches;
          this.loadedMatches.emit(matches);
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
