import {Widget, Field} from "client-bus";


@Widget({
  fqelement: "List",
  template: `
    <div class="list-group">
      <div class="list-group-item-text">
        <dv-widget name="ShowList"></dv-widget>
      </div>
      <div class="list-group-item-text">
        <dv-widget name="AddItem"></dv-widget>
      </div>
    </div>
  `
})
export class EditListComponent {
  @Field("List") list;
}
