import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
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
export class ShowNextAvailabilityComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
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
  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showNextAvailability = this;
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
      this.gs.get<NextAvailabilityRes>(this.apiPath, {
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
      })
        .pipe(map((res: NextAvailabilityRes) => res.data.nextAvailability))
        .subscribe((nextAvailability) => {
          this.nextAvailability = nextAvailability;
          this.loadedNextAvailability.emit(nextAvailability);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.nextAvailability && this.scheduleIds && this.gs);
  }
}
