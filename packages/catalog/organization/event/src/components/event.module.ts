import {NgModule}      from "@angular/core";
import {CommonModule}  from "@angular/common";
import {NewEventComponent} from "./new-event/new-event";
import {ShowEventComponent} from "./show-event/show-event";


@NgModule({
  imports: [CommonModule],
  declarations: [NewEventComponent, ShowEventComponent]
})
export class EventModule {}
