import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy,
  OnInit, Output, Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService,
  WaiterService, WaiterServiceFactory
} from '@deja-vu/core';

import { ShowLabelComponent } from '../show-label/show-label.component';

import { API_PATH } from '../label.config';
import { Label } from '../shared/label.model';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import * as _ from 'lodash';
import { filter, take, takeUntil } from 'rxjs/operators';


interface LabelsRes {
  data: { labels: Label[] };
  errors: { message: string }[];
}

@Component({
  selector: 'label-show-labels',
  templateUrl: './show-labels.component.html',
  styleUrls: ['./show-labels.component.css']
})
export class ShowLabelsComponent implements
  AfterViewInit, OnEval, OnInit, OnChanges, OnDestroy {
  @Input() waitOn: string[];
  // Fetch rules
  @Input() itemId: string | undefined;

  // Presentation inputs
  @Input() noLabelsToShowText = 'No labels to show';

  @Input() showLabel: ComponentValue = {
    type: <Type<Component>>ShowLabelComponent
  };

  @Output() labels = new EventEmitter<Label[]>();

  _labels: Label[] = [];

  destroyed = new Subject<any>();
  showLabels;
  private gs: GatewayService;
  private ws: WaiterService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory, private router: Router,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showLabels = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.ws = this.wsf.for(this, this.waitOn);

    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.destroyed))
      .subscribe(() => {
        this.load();
      });
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.ws && this.ws.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      await this.ws.maybeWait();
      this.gs.get<LabelsRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              itemId: this.itemId
            }
          }),
          extraInfo: { returnFields: 'id' }
        }
      })
        .subscribe((res) => {
          this._labels = res.data.labels;
          this.labels.emit(this._labels);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
