import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, RunService,
  WaiterService, WaiterServiceFactory
} from '@deja-vu/core';
import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';


interface ResourceRes {
  data: { resource: Resource; };
}

@Component({
  selector: 'authorization-show-resource',
  templateUrl: './show-resource.component.html',
  styleUrls: ['./show-resource.component.css']
})
export class ShowResourceComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  @Input() waitOn: string[];
  @Input() resource: Resource | undefined;
  @Input() id: string | undefined;
  @Output() fetchedResource = new EventEmitter<Resource>();

  private gs: GatewayService;
  private ws: WaiterService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.ws = this.wsf.for(this, this.waitOn);
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
      await this.ws.maybeWait();
      this.gs.get<ResourceRes>(this.apiPath, {
        params: {
          inputs: { id: this.id },
          extraInfo: {
            returnFields: `
              id
              ownerId
              viewerIds
            `
          }
        }
      })
      .subscribe((res) => {
        this.resource = res.data.resource;
        this.fetchedResource.emit(this.resource);
      });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs && !this.resource && this.id);
  }
}
