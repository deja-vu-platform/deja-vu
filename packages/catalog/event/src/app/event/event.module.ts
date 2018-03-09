import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import {
  ChooseAndShowWeeklyEventComponent
} from './choose-and-show-weekly-event/choose-and-show-weekly-event.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { DeleteEventComponent } from './delete-event/delete-event.component';
import {
  NewWeeklyEventComponent
} from './new-weekly-event/new-weekly-event.component';
import { ShowEventComponent } from './show-event/show-event.component';


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
    MatButtonModule, MatDatepickerModule, MatInputModule, MatSelectModule,
    MatFormFieldModule,
    MatMomentDateModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class EventModule { }
