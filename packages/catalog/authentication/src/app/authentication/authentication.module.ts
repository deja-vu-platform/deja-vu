import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import {
  ChangePasswordComponent
} from './change-password/change-password.component';
import { LoggedInComponent } from './logged-in/logged-in.component';
import { RegisterUserComponent } from './register-user/register-user.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignOutComponent } from './sign-out/sign-out.component';

const allComponents = [
  ChangePasswordComponent, LoggedInComponent, RegisterUserComponent,
  SignInComponent, SignOutComponent
];

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    DvModule,
    FormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class AuthenticationModule { }
