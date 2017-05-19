import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-task",
  template: `{{task.name}}`
  })
export class ShowTaskComponent {
  task = {name: ""};
}
