import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { AuthenticateComponent } from './authenticate/authenticate.component';
export { AuthenticateComponent };
import {
  ChangePasswordComponent
} from './change-password/change-password.component';
export { ChangePasswordComponent };
import { ConfigWizardComponent } from './config-wizard/config-wizard.component';
import { LoggedInComponent } from './logged-in/logged-in.component';
export { LoggedInComponent };
import { RegisterUserComponent } from './register-user/register-user.component';
export { RegisterUserComponent };
import { ShowUserComponent } from './show-user/show-user.component';
export { ShowUserComponent };
import { SignInComponent } from './sign-in/sign-in.component';
export { SignInComponent };
import { SignOutComponent } from './sign-out/sign-out.component';
export { SignOutComponent };
import { ChooseUserComponent } from './choose-user/choose-user.component';
export { ChooseUserComponent };
import { ShowUsersComponent } from './show-users/show-users.component';
export { ShowUsersComponent };
import {
  ShowUserCountComponent
} from './show-user-count/show-user-count.component';
export { ShowUserCountComponent };


const allComponents = [
  AuthenticateComponent, ChangePasswordComponent, LoggedInComponent,
  RegisterUserComponent, ShowUserComponent, SignInComponent, SignOutComponent,
  ShowUsersComponent, ChooseUserComponent, ShowUserCountComponent,
  ConfigWizardComponent
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
