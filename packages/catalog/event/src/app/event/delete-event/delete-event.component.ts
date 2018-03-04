import {
  Component, AfterViewInit, ElementRef, Input, OnInit
} from '@angular/core';
import {
  GatewayServiceFactory, GatewayService, OnRun, RunService
} from 'dv-core';


@Component({
  selector: 'event-delete-event',
  templateUrl: './delete-event.component.html',
  styleUrls: ['./delete-event.component.css']
})
export class DeleteEventComponent implements OnInit, OnRun {
  @Input() id;
  gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  dvOnRun(): Promise<any> {
    return this.gs
      .post('/graphql', JSON.stringify({
        query: `mutation {
          deleteEvent (id: "${this.id}")
        }`
      }))
      .toPromise();
  }

  deleteEvent() {
    this.rs.run(this.elem);
  }
}
