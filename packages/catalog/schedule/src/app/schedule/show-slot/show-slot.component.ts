import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
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
export class ShowSlotComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  // Provide one of the following: id or slot
  @Input() id: string | undefined;
  @Input() slot: Slot | undefined;
  @Output() loadedSlot = new EventEmitter();

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  // See https://angular.io/api/common/DatePipe
  @Input() dateTimeFormatString = 'medium';

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<SlotRes>(this.apiPath, {
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
      });
      this.slot = res.data.slot;
      this.loadedSlot.emit(this.slot);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.slot && this.id && this.dvs);
  }
}
