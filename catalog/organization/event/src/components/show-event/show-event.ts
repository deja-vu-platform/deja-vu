import {Widget} from "client-bus";


@Widget({
  fqelement: "Event",
  template: `{{event.start_date}} - {{event.end_date}}`
})
export class ShowEventComponent {
  event = {start_date: "", end_date: ""};
}
