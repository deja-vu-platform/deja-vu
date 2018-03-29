import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import {
  ChangePasswordComponent
} from './change-password/change-password.component';
export { ChangePasswordComponent };
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

const allComponents = [
  ChangePasswordComponent, LoggedInComponent, RegisterUserComponent,
  ShowUserComponent, SignInComponent, SignOutComponent
];

@NgModule({
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
})
export class AuthenticationModule { }
