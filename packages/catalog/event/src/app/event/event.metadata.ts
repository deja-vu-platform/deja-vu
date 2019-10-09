import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import {
  ChooseAndShowSeriesComponent
} from './choose-and-show-series/choose-and-show-series.component';
export { ChooseAndShowSeriesComponent };
import { CreateEventComponent } from './create-event/create-event.component';
export { CreateEventComponent };
import { CreateSeriesComponent } from './create-series/create-series.component';
export { CreateSeriesComponent };
import {
  CreateWeeklySeriesComponent
} from './create-weekly-series/create-weekly-series.component';
export { CreateWeeklySeriesComponent };
import { ConfigWizardComponent } from './config-wizard/config-wizard.component';
import { DeleteEventComponent } from './delete-event/delete-event.component';
export { DeleteEventComponent };
import { ShowEventComponent } from './show-event/show-event.component';
export { ShowEventComponent };
import { ShowEventsComponent } from './show-events/show-events.component';
export { ShowEventsComponent };
import {
  ShowEventCountComponent
} from './show-event-count/show-event-count.component';
export { ShowEventCountComponent };
import { UpdateEventComponent } from './update-event/update-event.component';
export { UpdateEventComponent };


const allComponents = [
  ChooseAndShowSeriesComponent, ShowEventComponent, CreateEventComponent,
  CreateSeriesComponent, CreateWeeklySeriesComponent, DeleteEventComponent,
  ShowEventsComponent, ShowEventCountComponent, ConfigWizardComponent, UpdateEventComponent
];

const metadata = {
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
};

export { metadata };
