import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../schedule.config';
import { Slot } from '../shared/schedule.model';
import { ShowSlotComponent } from '../show-slot/show-slot.component';

interface NextAvailabilityRes {
  data: { nextAvailability: Slot };
}


@Component({
  selector: 'schedule-show-next-availability',
  templateUrl: './show-next-availability.component.html',
  styleUrls: ['./show-next-availability.component.css']
})
export class ShowNextAvailabilityComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  @Input() scheduleIds: string[];
  @Output() loadedNextAvailability = new EventEmitter();

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  // See https://angular.io/api/common/DatePipe
  @Input() dateTimeFormatString = 'medium';

  @Input() showSlot: ComponentValue = {
    type: <Type<Component>> ShowSlotComponent
  };

  nextAvailability: Slot;

  showNextAvailability;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showNextAvailability = this;
  }

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
      const res = await this.dvs.get<NextAvailabilityRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              scheduleIds: this.scheduleIds
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
      });
      this.nextAvailability = res.data.nextAvailability;
      this.loadedNextAvailability.emit(this.nextAvailability);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.nextAvailability && this.scheduleIds && this.dvs);
  }
}
