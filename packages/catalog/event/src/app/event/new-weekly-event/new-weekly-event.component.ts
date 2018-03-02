import {
  Component, AfterViewInit, ElementRef, Input, OnInit
} from '@angular/core';
import {
  GatewayServiceFactory, GatewayService, RunService, OnRun
} from 'dv-core';

@Component({
  selector: 'event-new-weekly-event',
  templateUrl: './new-weekly-event.component.html',
  styleUrls: ['./new-weekly-event.component.css']
})
export class NewWeeklyEventComponent implements OnInit, OnRun {
  @Input() id = ''; // optional
  startsOn = '';
  endsOn = '';
  startTime = '';
  endTime = '';
  gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(id: string): Promise<void> {
    await this.gs
      .post('/graphql', JSON.stringify({
        query: `mutation {
          createWeeklyEvent(input: {
            ${this.id ? `id: "${this.id}",` : ''}
            startsOn: "${this.startsOn}", endsOn: "${this.endsOn}",
            startTime: "${this.startTime}", endTime: "${this.endTime}"
          }) {
            id
          }
        }`
      }))
      .toPromise();
  }
}
