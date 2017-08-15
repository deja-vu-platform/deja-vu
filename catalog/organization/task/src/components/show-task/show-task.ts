import {Widget, Field, Atom} from "client-bus";


@Widget({
  fqelement: "Task",
  template: `{{task.name}}`
  })
export class ShowTaskComponent {
  @Field("Task") task: Atom;
}
