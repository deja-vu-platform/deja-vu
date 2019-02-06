import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@dejavu-lang/core';

import {
  ChooseAndShowSeriesComponent
} from './choose-and-show-series/choose-and-show-series.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { CreateSeriesComponent } from './create-series/create-series.component';
import {
  CreateWeeklySeriesComponent
} from './create-weekly-series/create-weekly-series.component';
import { DeleteEventComponent } from './delete-event/delete-event.component';
import { ShowEventComponent } from './show-event/show-event.component';
import { ShowEventsComponent } from './show-events/show-events.component';

export {
  ChooseAndShowSeriesComponent, CreateEventComponent, CreateSeriesComponent,
  CreateWeeklySeriesComponent, DeleteEventComponent, ShowEventComponent,
  ShowEventsComponent
};

import { API_PATH } from './event.config';

const allComponents = [
  ChooseAndShowSeriesComponent, ShowEventComponent, CreateEventComponent,
  CreateSeriesComponent, CreateWeeklySeriesComponent, DeleteEventComponent,
  ShowEventsComponent
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
  providers: [
    { provide: API_PATH, useValue: '/graphql' }
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class EventModule { }
