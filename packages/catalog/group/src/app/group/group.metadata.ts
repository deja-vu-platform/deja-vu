import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { AddToGroupComponent } from './add-to-group/add-to-group.component';
export { AddToGroupComponent };
import { ChooseGroupComponent } from './choose-group/choose-group.component';
export { ChooseGroupComponent };
import { CreateGroupComponent } from './create-group/create-group.component';
export { CreateGroupComponent };
import { DeleteGroupComponent } from './delete-group/delete-group.component';
export { DeleteGroupComponent };
import { InputMemberComponent } from './input-member/input-member.component';
export { InputMemberComponent };
import { JoinLeaveComponent } from './join-leave/join-leave.component';
export { JoinLeaveComponent };
import { ShowGroupComponent } from './show-group/show-group.component';
export { ShowGroupComponent };
import { ShowGroupsComponent } from './show-groups/show-groups.component';
export { ShowGroupsComponent };
import { ShowMemberComponent } from './show-member/show-member.component';
export { ShowMemberComponent };
import { ShowMembersComponent } from './show-members/show-members.component';
export { ShowMembersComponent };
import { StageComponent } from './stage/stage.component';
export { StageComponent };
import { ShowGroupCountComponent } from './show-group-count/show-group-count.component';
export { ShowGroupCountComponent };
import { ShowMemberCountComponent } from './show-member-count/show-member-count.component';
export { ShowMemberCountComponent };


const allComponents = [
  AddToGroupComponent, ChooseGroupComponent, CreateGroupComponent,
  DeleteGroupComponent, InputMemberComponent, JoinLeaveComponent,
  ShowGroupComponent, ShowGroupsComponent, ShowMemberComponent,
  ShowMembersComponent, StageComponent, ShowGroupCountComponent, ShowMemberCountComponent
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
