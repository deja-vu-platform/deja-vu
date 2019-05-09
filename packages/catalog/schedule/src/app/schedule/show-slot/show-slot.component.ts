import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../schedule.config';
import { Slot } from '../shared/schedule.model';

interface SlotRes {
  data: { slot: Slot };
}


@Component({
  selector: 'schedule-show-slot',
  templateUrl: './show-slot.component.html',
  styleUrls: ['./show-slot.component.css']
})
export class ShowSlotComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or slot
  @Input() id: string | undefined;
  @Input() slot: Slot | undefined;
  @Output() loadedSlot = new EventEmitter();

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  // See https://angular.io/api/common/DatePipe
  @Input() dateTimeFormatString = 'medium';

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
      this.gs.get<SlotRes>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showStartDate ? 'startDate' : ''}
              ${this.showEndDate ? 'endDate' : ''}
            `
          }
        }
      })
      .pipe(map((res: SlotRes) => res.data.slot))
      .subscribe((slot) => {
        this.slot = slot;
        this.loadedSlot.emit(slot);
      });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.slot && this.id && this.gs);
  }
}
