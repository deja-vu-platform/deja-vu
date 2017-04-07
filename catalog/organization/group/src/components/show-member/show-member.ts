import {Widget} from "client-bus";

@Widget({
  fqelement: "Group",
  template: `{{member.name}}`
})
export class ShowMemberComponent {
  member = { name: "", atom_id: "" };
}
