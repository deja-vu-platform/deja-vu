import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../match.config';
import { Match } from '../shared/match.model';

interface ShowMatchRes {
  data: { match: Match };
}

import * as _ from 'lodash';


@Component({
  selector: 'match-show-match',
  templateUrl: './show-match.component.html'
})
export class ShowMatchComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Provide one of the following: id, (userAId and userBId) or match
  @Input() id: string | undefined;
  @Input() userAId: string | undefined;
  @Input() userBId: string | undefined;
  @Input() match: Match | undefined;
  @Output() loadedMatch = new EventEmitter();

  @Input() showId = true;
  @Input() showUserIds = true;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
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
      const res = await this.dvs.waitAndGet<ShowMatchRes>(this.apiPath, () => ({
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
      }));
      this.match = res.data.match;
      this.loadedMatch.emit(this.match);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.match &&
      (this.id || (this.userAId && this.userBId)) && this.dvs);
  }
}
