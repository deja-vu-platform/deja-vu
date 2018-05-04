import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';

import { GatewayService, GatewayServiceFactory  } from 'dv-core';
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
export class ShowResourceComponent implements OnInit, OnChanges {
  @Input() resource: Resource | undefined;
  @Input() id: string | undefined;
  @Output() fetchedResource = new EventEmitter<Resource>();

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.gs && !this.resource && this.id) {
      this.gs.get<ResourceRes>(this.apiPath, {
        params: {
          query: `
            query {
              resource(id: "${this.id}") {
                id,
                ownerId,
                viewerIds
              }
            }
          `
        }
      })
      .subscribe((res) => {
        this.resource = res.data.resource;
        this.fetchedResource.emit(this.resource);
      });
    }
  }
}
