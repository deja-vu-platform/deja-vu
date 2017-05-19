import {Widget} from "client-bus";


@Widget({
  fqelement: "Task",
  template: `{{task.name}}`
  })
export class ShowTaskComponent {
  task = {name: ""};
}
