import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { AddToGroupComponent } from './add-to-group/add-to-group.component';
import { ChooseGroupComponent } from './choose-group/choose-group.component';
import { CreateGroupComponent } from './create-group/create-group.component';
import { DeleteGroupComponent } from './delete-group/delete-group.component';
import { InputMemberComponent } from './input-member/input-member.component';
import { JoinLeaveComponent } from './join-leave/join-leave.component';
import { ShowGroupComponent } from './show-group/show-group.component';
import { ShowGroupsComponent } from './show-groups/show-groups.component';
import { ShowMemberComponent } from './show-member/show-member.component';
import { ShowMembersComponent } from './show-members/show-members.component';
import { StageComponent } from './stage/stage.component';


const allComponents = [
  AddToGroupComponent, ChooseGroupComponent, CreateGroupComponent,
  DeleteGroupComponent, InputMemberComponent, JoinLeaveComponent,
  ShowGroupComponent, ShowGroupsComponent, ShowMemberComponent,
  ShowMembersComponent, StageComponent
];


const metadata = {
  imports: [
    CommonModule,
    DvModule,
    FormsModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule
  ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
};

export { metadata };
