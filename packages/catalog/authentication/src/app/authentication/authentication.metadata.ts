import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { AuthenticateComponent } from './authenticate/authenticate.component';
import {
  ChangePasswordComponent
} from './change-password/change-password.component';
import { LoggedInComponent } from './logged-in/logged-in.component';
import { RegisterUserComponent } from './register-user/register-user.component';
import { ShowUserComponent } from './show-user/show-user.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignOutComponent } from './sign-out/sign-out.component';
import { ChooseUserComponent } from './choose-user/choose-user.component';
import { ShowUsersComponent } from './show-users/show-users.component';


const allComponents = [
  AuthenticateComponent, ChangePasswordComponent, LoggedInComponent,
  RegisterUserComponent, ShowUserComponent, SignInComponent, SignOutComponent,
  ShowUsersComponent, ChooseUserComponent
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
