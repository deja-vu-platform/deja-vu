import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';

@Component({
  selector: 'event-new-weekly-event',
  templateUrl: './new-weekly-event.component.html',
  styleUrls: ['./new-weekly-event.component.css']
})
export class NewWeeklyEventComponent {
  startsOn = '';
  endsOn = '';
  startTime = '';
  endTime = '';
  gs: GatewayService;

  constructor(
    private elem: ElementRef, gsf: GatewayServiceFactory) {
    this.gs = gsf.for(elem);
  }

  onSubmit() {
    this.gs
      .post('/graphql', JSON.stringify({
        query: `mutation {
          createWeeklyEvent(input: {
            startsOn: "${this.startsOn}", endsOn: "${this.endsOn}",
            startTime: "${this.startTime}", endTime: "${this.endTime}"
          }) {
            id
          }
        }`
      }))
      .subscribe(() => {
        // Clear out the fields on success
        this.startsOn = '';
        this.endsOn = '';
        this.startTime = '';
        this.endTime = '';
      });
  }

  /**
   * Fix an inconsistency with the current time appearing in time boxes when
   * they are clicked. The inconsistency is that when a user clicks the time
   * control for the first time, the current (rounded) time appears.
   * Subsequently, after the time is cleared, this doesn't happen anymore.
   */
  timeClickHandler(event: Event) {
    const MINUTE_ROUNDING_FACTOR = 15;
    const FIRST_PM_HOUR = 12;

    if (!event.srcElement['value']) {
      // Get a string containing the current time
      const currentTime = new Date();

      // Note: The behavior of the control is a bit weird in that it rounds up
      // to the nearest 15 minutes. We need to do that to keep consistent
      let minutes: number = currentTime.getMinutes();
      if (minutes % MINUTE_ROUNDING_FACTOR !== 0) {
        // Pushing the time forward wraps properly
        currentTime.setMinutes(minutes
          + (MINUTE_ROUNDING_FACTOR
            - (minutes % MINUTE_ROUNDING_FACTOR)));
        minutes = currentTime.getMinutes();
      }

      const totalHours: number = currentTime.getHours();
      const actualHours: number = totalHours % FIRST_PM_HOUR;
      const amPm: string = totalHours >= FIRST_PM_HOUR ? 'PM' : 'AM';
      event.srcElement['value'] = actualHours.toString() + ':'
        + minutes.toString() + ' ' + amPm;
    }
  }
}
