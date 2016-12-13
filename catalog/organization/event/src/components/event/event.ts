import {Widget} from "client-bus";


@Widget({
  template: `
    {{event.start_date}} - {{event.end_date}}
  `
})
export class EventComponent {
  event = {start_date: "", end_date: ""};
}
