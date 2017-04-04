import {Widget} from "client-bus";


@Widget({fqelement: "List", template: `{{item.name}}`})
export class ShowItemComponent {
  item = {name: ""};
}
