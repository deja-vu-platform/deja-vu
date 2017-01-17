import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-event",
  template: `
    {{event.start_date}} - {{event.end_date}}
  `
})
export class EventComponent {
  event = {start_date: "", end_date: ""};
}
