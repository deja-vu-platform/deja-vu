import {
  Component, AfterViewInit, ElementRef, Input, OnInit
} from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';


@Component({
  selector: 'event-delete-event',
  templateUrl: './delete-event.component.html',
  styleUrls: ['./delete-event.component.css']
})
export class DeleteEventComponent implements OnInit {
  @Input() id;
  gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
  }

  deleteEvent() {
    this.gs
      .post('/graphql', JSON.stringify({
        query: `mutation {
          deleteEvent (id: "${this.id}")
        }`
      }))
      .subscribe(() => undefined);
  }
}
