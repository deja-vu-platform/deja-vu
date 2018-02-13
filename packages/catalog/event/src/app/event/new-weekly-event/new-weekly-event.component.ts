import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';

@Component({
  selector: 'event-new-weekly-event',
  templateUrl: './new-weekly-event.component.html',
  styleUrls: ['./new-weekly-event.component.css']
})
export class NewWeeklyEventComponent implements AfterViewInit {
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
    const startsOnText: Element = document.getElementById('starts-on-text');
    const endsOnText: Element = document.getElementById('ends-on-text');
    const startTimeText: Element = document.getElementById('start-time-text');
    const endTimeText: Element = document.getElementById('end-time-text');

    this.startsOn = startsOnText['value'];
    this.endsOn = endsOnText['value'];
    this.startTime = startTimeText['value'];
    this.endTime = endTimeText['value'];

    this.gs
      .post(`
        newWeeklyPublicEvent(
          startsOn: "${this.startsOn}", ends_on: "${this.endsOn}",
          startTime: "${this.startTime}", end_time: "${this.endTime}") {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        // Clear out the fields on success
        startsOnText['value'] = '';
        endsOnText['value'] = '';
        startTimeText['value'] = '';
        endTimeText['value'] = '';

        this.startsOn = '';
        this.endsOn = '';
        this.startTime = '';
        this.endTime = '';
      });
  }

  update(e) {
    console.log(e);
  }

  ngAfterViewInit() {
    // Datepicker and timepicker scripts need to be loaded this way
    this.loadScript('bootstrap-datepicker/bootstrap-datepicker.min.js');
    this.loadStyle('bootstrap-datepicker/bootstrap-datepicker3.min.css');

    this.loadScript('bootstrap-timepicker/bootstrap-timepicker.min.js');
    this.loadStyle('bootstrap-timepicker/bootstrap-timepicker.css');
  }

  private loadScript(src: string) {
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'node_modules/dv-organization-event/lib/components/' +
      'new-weekly-event/vendor/' + src;
    this.elem.nativeElement.appendChild(s);
  }

  private loadStyle(href: string) {
    const s = document.createElement('link');
    s.type = 'text/css';
    s.rel = 'stylesheet';
    s.href = 'node_modules/dv-organization-event/lib/components/' +
      'new-weekly-event/vendor/' + href;
    this.elem.nativeElement.appendChild(s);
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
