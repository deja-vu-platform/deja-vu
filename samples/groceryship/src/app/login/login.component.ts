import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';

import {
  RegisterDialogComponent
} from '../register-dialog/register-dialog.component';


@Component({
  selector: 'groceryship-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  userId: string;

  constructor(public dialog: MatDialog) { }

  openRegisterDialog() {
    this.dialog.open(RegisterDialogComponent, {});
  }
}
