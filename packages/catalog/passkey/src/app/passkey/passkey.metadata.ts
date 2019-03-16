import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import {
  BrowserAnimationsModule
} from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import {
  CreatePasskeyComponent
} from './create-passkey/create-passkey.component';
export { CreatePasskeyComponent };
import { LoggedInComponent } from './logged-in/logged-in.component';
export { LoggedInComponent };
import { SignInComponent } from './sign-in/sign-in.component';
export { SignInComponent };
import { SignOutComponent } from './sign-out/sign-out.component';
export { SignOutComponent };
import { ValidateComponent } from './validate/validate.component';
export { ValidateComponent };
import { ShowPasskeyComponent } from './show-passkey/show-passkey.component';
export { ShowPasskeyComponent };

const allComponents = [
  CreatePasskeyComponent, SignInComponent, SignOutComponent,
  LoggedInComponent, ValidateComponent, ShowPasskeyComponent
];

const metadata = {
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};

export { metadata };
