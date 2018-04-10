import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import {
  ChangePasswordDialogComponent
} from '../change-password-dialog/change-password-dialog.component';
import {
  EditProfileDialogComponent
} from '../edit-profile-dialog/edit-profile-dialog.component';


@Component({
  selector: 'groceryship-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  user;

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  openEditProfileDialog() {
    if (this.user) {
      this.dialog.open(EditProfileDialogComponent, {
        // can also specify dialog height and width here
        data: { id: this.user.id }
      });
    }
  }

  openChangePasswordDialog() {
    if (this.user) {
      this.dialog.open(ChangePasswordDialogComponent, {
        // can also specify dialog height and width here
        data: { userId: this.user.id }
      });
    }
  }
}
