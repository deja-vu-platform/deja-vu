import {Widget} from "client-bus";

@Widget({
  fqelement: "Group",
  template: `{{group.name}}`
})
export class ShowGroupOverviewComponent {
  group = { name: "", atom_id: "" };
}
