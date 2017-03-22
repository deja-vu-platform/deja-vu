import {Widget} from "client-bus";

@Widget({
  fqelement: "dv-organization-group",
  template: `{{member.name}}`
})
export class ShowMemberComponent {
  member = { name: "", atom_id: "" };
}
