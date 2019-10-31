import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';

import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
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

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dsf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dsf.forComponent(this)
      .withDefaultWaiter()
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
      const res = await this.dvs.waitAndGet<ResourceRes>(this.apiPath, () => ({
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
      }));
      this.resource = res.data.resource;
      this.fetchedResource.emit(this.resource);
    } else if (this.dvs) {
      this.dvs.gateway.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs && !this.resource && this.id);
  }
}
