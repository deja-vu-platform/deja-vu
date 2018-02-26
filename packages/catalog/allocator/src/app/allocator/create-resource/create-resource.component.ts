import {
  Component, Input, ElementRef, Output, EventEmitter
} from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';

import { map } from 'rxjs/operators';


interface CreateResourceRes {
  data: {createResource: {id: string}};
}


@Component({
  selector: 'allocator-create-resource',
  templateUrl: './create-resource.component.html'
})
export class CreateResourceComponent {
  @Input() id: string;
  @Output() resource = new EventEmitter();
  gs: GatewayService;

  constructor(elem: ElementRef, gsf: GatewayServiceFactory) {
    this.gs = gsf.for(elem);
  }

  run() {
    console.log(`Saving resource ${this.id}`);
    this.gs
      .post<CreateResourceRes>('/graphql', JSON.stringify({
        query: `mutation {
          createResource(id: "${this.id}") {
            id
          }
        }`
      }))
      .pipe(map(res => res.data.createResource))
      .subscribe(resource => {
        this.resource.emit({id: resource.id});
      });
  }
}
