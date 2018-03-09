import {
  AfterViewInit, Component, ElementRef, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterCommit, OnRun, RunService
} from 'dv-core';
import * as _ from 'lodash';


@Component({
  selector: 'event-delete-event',
  templateUrl: './delete-event.component.html',
  styleUrls: ['./delete-event.component.css']
})
export class DeleteEventComponent implements OnInit, OnRun, OnAfterCommit {
  @Input() id;
  // Optional list of events to delete itself from after commit
  @Input() events: Event[];
  gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  dvOnRun() {
    this.gs
      .post('/graphql', {
        query: `mutation {
          deleteEvent (id: "${this.id}")
        }`
      })
      .toPromise();
  }

  dvOnAfterCommit() {
    _.remove(this.events, {id: this.id});
  }

  deleteEvent() {
    this.rs.run(this.elem);
  }
}
