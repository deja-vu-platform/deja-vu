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
import { AllAvailability } from '../shared/schedule.model';

interface AllAvailabilityRes {
  data: { allAvailability: AllAvailability };
}


@Component({
  selector: 'schedule-show-all-availability',
  templateUrl: './show-all-availability.component.html'
})
export class ShowAllAvailabilityComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or all-availability
  @Input() id: string | undefined;
  @Input() allAvailability: AllAvailability | undefined;
  @Output() loadedAllAvailability = new EventEmitter();

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
      this.gs.get<AllAvailabilityRes>(this.apiPath, {
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
      .pipe(map((res: AllAvailabilityRes) => res.data.allAvailability))
      .subscribe((allAvailability) => {
        this.allAvailability = allAvailability;
        this.loadedAllAvailability.emit(allAvailability);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.allAvailability && this.id && this.gs);
  }
}
