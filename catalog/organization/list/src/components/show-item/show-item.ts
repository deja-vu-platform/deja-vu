import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-list",
  template: `{{item.name}}`
})
export class ShowItemComponent {
  item = {name: ""};
}
