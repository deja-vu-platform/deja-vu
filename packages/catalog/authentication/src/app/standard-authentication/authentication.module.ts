import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { LoggedInComponent } from './logged-in/logged-in.component';
import { RegisterComponent } from './register/register.component';
import { RegisterWithRedirectComponent } from './register-with-redirect/register-with-redirect.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignInWithRedirectComponent } from './sign-in-with-redirect/sign-in-with-redirect.component';
import { SignOutComponent } from './sign-out/sign-out.component';
import { SignOutWithRedirectComponent } from './sign-out-with-redirect/sign-out-with-redirect.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ChangePasswordComponent, LoggedInComponent, RegisterComponent, RegisterWithRedirectComponent, SignInComponent, SignInWithRedirectComponent, SignOutComponent, SignOutWithRedirectComponent]
})
export class authenticationModule { }
