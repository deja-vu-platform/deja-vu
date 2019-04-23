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
import { Slot } from '../shared/schedule.model';

interface NextAvailabilityRes {
  data: { nextAvailability: Slot };
}


@Component({
  selector: 'schedule-show-next-availability',
  templateUrl: './show-next-availability.component.html'
})
export class ShowNextAvailabilityComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or next-availability
  @Input() id: string | undefined;
  @Input() nextAvailability: Slot | undefined;
  @Output() loadedNextAvailability = new EventEmitter();

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
      this.gs.get<NextAvailabilityRes>(this.apiPath, {
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
      .pipe(map((res: NextAvailabilityRes) => res.data.nextAvailability))
      .subscribe((nextAvailability) => {
        this.nextAvailability = nextAvailability;
        this.loadedNextAvailability.emit(nextAvailability);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.nextAvailability && this.id && this.gs);
  }
}
