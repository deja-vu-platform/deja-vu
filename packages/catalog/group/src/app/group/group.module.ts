import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule, MatButtonModule, MatFormFieldModule,
  MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import { AddToGroupComponent } from './add-to-group/add-to-group.component';
import { AutocompleteComponent } from './autocomplete/autocomplete.component';
import { CreateGroupComponent } from './create-group/create-group.component';
import { CreateMemberComponent } from './create-member/create-member.component';
import { JoinLeaveComponent } from './join-leave/join-leave.component';
import { ShowGroupComponent } from './show-group/show-group.component';
import { ShowGroupsComponent } from './show-groups/show-groups.component';
import { ShowMemberComponent } from './show-member/show-member.component';
import { ShowMembersComponent } from './show-members/show-members.component';
import { StageComponent } from './stage/stage.component';


const allComponents =  [
  AddToGroupComponent, AutocompleteComponent, CreateGroupComponent,
  CreateMemberComponent, JoinLeaveComponent, ShowGroupComponent,
  ShowGroupsComponent, ShowMemberComponent, ShowMembersComponent,
  StageComponent
];
@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatAutocompleteModule, MatButtonModule, MatInputModule,
    MatFormFieldModule
  ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
})
export class GroupModule { }
