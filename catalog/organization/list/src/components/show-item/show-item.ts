import {Widget} from "client-bus";


@Widget({fqelement: "List", template: `{{item.name}}`})
export class ShowItemComponent {
  item = {name: "", checked: false, atom_id: ""};
}
