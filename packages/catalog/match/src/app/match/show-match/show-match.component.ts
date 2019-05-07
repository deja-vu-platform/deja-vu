import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../match.config';
import { Match } from '../shared/match.model';

interface ShowMatchRes {
  data: { match: Match };
}


@Component({
  selector: 'match-show-match',
  templateUrl: './show-match.component.html'
})
export class ShowMatchComponent implements AfterViewInit, OnChanges, OnEval,
  OnInit {
  // Provide one of the following: id, (userAId and userBId) or match
  @Input() id: string | undefined;
  @Input() userAId: string | undefined;
  @Input() userBId: string | undefined;
  @Input() match: Match | undefined;
  @Output() loadedMatch = new EventEmitter();

  @Input() showId = true;
  @Input() showUserIds = true;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

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
      this.gs.get<ShowMatchRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              id: this.id,
              userAId: this.userAId,
              userBId: this.userBId
            }
          }),
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showUserIds ? 'userAId' : ''}
              ${this.showUserIds ? 'userBId' : ''}
            `
          }
        }
      })
        .pipe(map((res: ShowMatchRes) => res.data.match))
        .subscribe((match) => {
          this.match = match;
          this.loadedMatch.emit(match);
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.match &&
      (this.id || (this.userAId && this.userBId)) &&
      this.gs);
  }
}
