import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../schedule.config';
import { Schedule } from '../shared/schedule.model';

interface ShowScheduleRes {
  data: { schedule: Schedule };
}


@Component({
  selector: 'schedule-show-schedule',
  templateUrl: './show-schedule.component.html'
})
export class ShowScheduleComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or schedule
  @Input() id: string | undefined;
  @Input() schedule: Schedule | undefined;
  @Output() loadedSchedule = new EventEmitter();

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
      this.gs.get<ShowScheduleRes>(this.apiPath, {
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
      .pipe(map((res: ShowScheduleRes) => res.data.schedule))
      .subscribe((schedule) => {
        this.schedule = schedule;
        this.loadedSchedule.emit(schedule);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.schedule && this.id && this.gs);
  }
}
