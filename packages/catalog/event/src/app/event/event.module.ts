import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewWeeklyEventComponent } from './new-weekly-event/new-weekly-event.component';
import { ChooseAndShowWeeklyEventComponent } from './choose-and-show-weekly-event/choose-and-show-weekly-event.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [NewWeeklyEventComponent, ChooseAndShowWeeklyEventComponent]
})
export class EventModule { }
