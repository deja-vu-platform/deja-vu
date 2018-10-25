import {
  AfterViewInit, Component, ElementRef, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExecCommit, OnExec, RunService
} from 'dv-core';
import * as _ from 'lodash';


@Component({
  selector: 'event-delete-event',
  templateUrl: './delete-event.component.html',
  styleUrls: ['./delete-event.component.css']
})
export class DeleteEventComponent implements OnInit, OnExec, OnExecCommit {
  @Input() id;
  // Optional list of events to delete itself from after commit
  @Input() events: Event[];
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  dvOnExec() {
    this.gs
      .post('/graphql', {
        query: `mutation {
          deleteEvent (id: "${this.id}")
        }`
      })
      .toPromise();
  }

  dvOnExecCommit() {
    _.remove(this.events, {id: this.id});
  }

  deleteEvent() {
    this.rs.exec(this.elem);
  }
}
