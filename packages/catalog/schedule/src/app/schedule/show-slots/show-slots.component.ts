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

interface SlotsRes {
  data: { slots: Slot[] };
}


@Component({
  selector: 'schedule-show-slots',
  templateUrl: './show-slots.component.html'
})
export class ShowSlotsComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or slots
  @Input() id: string | undefined;
  @Input() slots: Slot[] | undefined;
  @Output() loadedSlots = new EventEmitter();

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
      this.gs.get<SlotsRes>(this.apiPath, {
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
      .pipe(map((res: SlotsRes) => res.data.slots))
      .subscribe((slots) => {
        this.slots = slots;
        this.loadedSlots.emit(slots);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.slots && this.id && this.gs);
  }
}
