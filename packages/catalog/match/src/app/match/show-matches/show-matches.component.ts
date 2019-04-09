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
import { Matches } from '../shared/match.model';

interface MatchesRes {
  data: { matches: Matches };
}


@Component({
  selector: 'match-show-matches',
  templateUrl: './show-matches.component.html'
})
export class ShowMatchesComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or matches
  @Input() id: string | undefined;
  @Input() matches: Matches | undefined;
  @Output() loadedMatches = new EventEmitter();

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
      this.gs.get<MatchesRes>(this.apiPath, {
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
      .pipe(map((res: MatchesRes) => res.data.matches))
      .subscribe((matches) => {
        this.matches = matches;
        this.loadedMatches.emit(matches);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.matches && this.id && this.gs);
  }
}
