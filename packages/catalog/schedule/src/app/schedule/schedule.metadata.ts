import { CommonModule } from '@angular/common';
// import required for packaging
import { ModuleWithProviders } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

// import required for packaging
import {
  CalendarDateFormatter, CalendarEventTitleFormatter, CalendarModule
} from 'angular-calendar';

import { CalendarWeekHoursViewModule } from 'angular-calendar-week-hours-view';


// import and export all cliché actions here
import { CreateScheduleComponent } from './create-schedule/create-schedule.component';
export { CreateScheduleComponent };
import { DeleteScheduleComponent } from './delete-schedule/delete-schedule.component';
export { DeleteScheduleComponent };
import { ShowScheduleComponent } from './show-schedule/show-schedule.component';
export { ShowScheduleComponent };
import { UpdateScheduleComponent } from './update-schedule/update-schedule.component';
export { UpdateScheduleComponent };
import { TestComponent } from './test/test.component';
export { TestComponent };

// add all cliché actions here
const allComponents = [
  CreateScheduleComponent, DeleteScheduleComponent,
  ShowScheduleComponent, UpdateScheduleComponent, TestComponent
];

const metadata = {
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule,
    CalendarModule.forRoot(),
    CalendarWeekHoursViewModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};

export { metadata };
