import {Widget, Field} from "client-bus";

@Widget({
  fqelement: "Group",
  template: `{{group.name}}`
})
export class ShowGroupOverviewComponent {
  @Field("Group") group;
}
