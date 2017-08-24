import {Widget, Field} from "client-bus";


@Widget({
  fqelement: "Checklist",
  template: `
    <div class="list-group">
      <div class="list-group-item-text">
        <dv-widget name="ShowChecklist"></dv-widget>
      </div>
      <div class="list-group-item-text">
        <dv-widget name="AddItem"></dv-widget>
      </div>
    </div>
  `
})
export class EditListComponent {
  @Field("Checklist") checklist;
}
