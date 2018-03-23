import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShowSubgroupsOfGroupComponent } from './show-subgroups-of-group/show-subgroups-of-group.component';
import { EditSubgroupsOfGroupComponent } from './edit-subgroups-of-group/edit-subgroups-of-group.component';
import { ShowNameOfMemberComponent } from './show-name-of-member/show-name-of-member.component';
import { EditNameOfGroupComponent } from './edit-name-of-group/edit-name-of-group.component';
import { ShowMembersComponent } from './show-members/show-members.component';
import { ShowGroupsComponent } from './show-groups/show-groups.component';
import { ShowNameOfGroupComponent } from './show-name-of-group/show-name-of-group.component';
import { EditMembersOfGroupComponent } from './edit-members-of-group/edit-members-of-group.component';
import { EditNameOfMemberComponent } from './edit-name-of-member/edit-name-of-member.component';
import { ShowMembersOfGroupComponent } from './show-members-of-group/show-members-of-group.component';
import { NewGroupWithInitialMemberButtonComponent } from './new-group-with-initial-member-button/new-group-with-initial-member-button.component';
import { ShowGroupsByDirectSubgroupComponent } from './show-groups-by-direct-subgroup/show-groups-by-direct-subgroup.component';
import { AddSubgroupToGroupComponent } from './add-subgroup-to-group/add-subgroup-to-group.component';
import { JoinLeaveComponent } from './join-leave/join-leave.component';
import { ShowSubgroupsByGroupComponent } from './show-subgroups-by-group/show-subgroups-by-group.component';
import { ShowGroupsByDirectMemberComponent } from './show-groups-by-direct-member/show-groups-by-direct-member.component';
import { SharedComponent } from './-shared/-shared.component';
import { AddNewMemberToGroupComponent } from './add-new-member-to-group/add-new-member-to-group.component';
import { ShowGroupsByMemberComponent } from './show-groups-by-member/show-groups-by-member.component';
import { AddNewMemberToGroupButtonComponent } from './add-new-member-to-group-button/add-new-member-to-group-button.component';
import { ShowGroupsBySubgroupComponent } from './show-groups-by-subgroup/show-groups-by-subgroup.component';
import { ShowMembersByGroupComponent } from './show-members-by-group/show-members-by-group.component';
import { AddMemberToGroupComponent } from './add-member-to-group/add-member-to-group.component';
import { NewMemberButtonComponent } from './new-member-button/new-member-button.component';
import { NewGroupButtonComponent } from './new-group-button/new-group-button.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ShowSubgroupsOfGroupComponent, EditSubgroupsOfGroupComponent, ShowNameOfMemberComponent, EditNameOfGroupComponent, ShowMembersComponent, ShowGroupsComponent, ShowNameOfGroupComponent, EditMembersOfGroupComponent, EditNameOfMemberComponent, ShowMembersOfGroupComponent, NewGroupWithInitialMemberButtonComponent, ShowGroupsByDirectSubgroupComponent, AddSubgroupToGroupComponent, JoinLeaveComponent, ShowSubgroupsByGroupComponent, ShowGroupsByDirectMemberComponent, SharedComponent, AddNewMemberToGroupComponent, ShowGroupsByMemberComponent, AddNewMemberToGroupButtonComponent, ShowGroupsBySubgroupComponent, ShowMembersByGroupComponent, AddMemberToGroupComponent, NewMemberButtonComponent, NewGroupButtonComponent]
})
export class GroupModule { }
