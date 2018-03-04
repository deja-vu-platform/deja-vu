import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatDatepickerModule, MatInputModule, MatSelectModule, MatFormFieldModule } from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

import { NewWeeklyEventComponent } from './new-weekly-event/new-weekly-event.component';
import { ChooseAndShowWeeklyEventComponent } from './choose-and-show-weekly-event/choose-and-show-weekly-event.component';
import { ShowEventComponent } from './show-event/show-event.component';
import { DvModule } from 'dv-core';
import { CreateEventComponent } from './create-event/create-event.component';
import { DeleteEventComponent } from './delete-event/delete-event.component';


const allComponents = [
  NewWeeklyEventComponent, ChooseAndShowWeeklyEventComponent,
  ShowEventComponent, CreateEventComponent, DeleteEventComponent
];

@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatDatepickerModule, MatInputModule, MatSelectModule, MatFormFieldModule,
    MatMomentDateModule
  ],
  declarations: allComponents,
  entryComponents: [ShowEventComponent],
  exports: allComponents
})
export class EventModule { }
