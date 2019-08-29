import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

// import and export all concept components here
import { CreateMatchComponent } from './create-match/create-match.component';
export { CreateMatchComponent };
import { ConfigWizardComponent } from './config-wizard/config-wizard.component';
import { DeleteMatchComponent } from './delete-match/delete-match.component';
export { DeleteMatchComponent };
import { ShowMatchComponent } from './show-match/show-match.component';
export { ShowMatchComponent };
import { AttemptMatchComponent } from './attempt-match/attempt-match.component';
export { AttemptMatchComponent };
import {
  WithdrawAttemptComponent
} from './withdraw-attempt/withdraw-attempt.component';
export { WithdrawAttemptComponent };
import { ShowMatchesComponent } from './show-matches/show-matches.component';
export { ShowMatchesComponent };
import { ShowAttemptComponent } from './show-attempt/show-attempt.component';
export { ShowAttemptComponent };
import { ShowAttemptsComponent } from './show-attempts/show-attempts.component';
export { ShowAttemptsComponent };


// add all concept components here
const allComponents = [
  CreateMatchComponent, DeleteMatchComponent, ShowMatchComponent,
  AttemptMatchComponent, WithdrawAttemptComponent, ShowMatchesComponent,
  ShowAttemptComponent, ShowAttemptsComponent, ConfigWizardComponent
];

const metadata = {
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};

export { metadata };
