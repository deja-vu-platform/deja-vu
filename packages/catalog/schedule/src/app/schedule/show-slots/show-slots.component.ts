import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../schedule.config';
import { Slot } from '../shared/schedule.model';
import { ShowSlotComponent } from '../show-slot/show-slot.component';

interface SlotsRes {
  data: { slots: Slot[] };
}


@Component({
  selector: 'schedule-show-slots',
  templateUrl: './show-slots.component.html',
  styleUrls: ['./show-slots.component.css']
})
export class ShowSlotsComponent implements AfterViewInit, OnChanges, OnEval,
  OnInit {
  // Provide one of the following: scheduleId or slots
  @Input() scheduleId: string | undefined;
  @Input() slots: Slot[] | undefined;

  // Must be of the following format: https://en.wikipedia.org/wiki/ISO_8601
  @Input() startDate: string | undefined;
  @Input() endDate: string | undefined;

  // Choose how to sort the slots
  @Input() sortByStartDate: 'asc'| 'desc' = 'asc';
  @Input() sortByEndDate: 'asc'| 'desc' = 'asc';

  @Output() loadedSlots = new EventEmitter();

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  // See https://angular.io/api/common/DatePipe
  @Input() dateTimeFormatString = 'medium';

  @Input() showSlot: Action = {
    type: <Type<Component>> ShowSlotComponent
  };

  showSlots;
  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showSlots = this;
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
      this.gs.get<SlotsRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              scheduleId: this.scheduleId,
              startDate: this.startDate,
              endDate: this.endDate,
              sortByStartDate: this.sortByStartDate === 'asc' ? 1 : -1,
              sortByEndDate: this.sortByEndDate === 'asc' ? 1 : -1
            }
          }),
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showStartDate ? 'startDate' : ''}
              ${this.showEndDate ? 'endDate' : ''}
            `
          }
        }
      })
        .pipe(map((res: SlotsRes) => res.data.slots))
        .subscribe((slots) => {
          this.slots = slots;
          this.loadedSlots.emit(slots);
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.slots && this.scheduleId && this.gs);
  }
}
