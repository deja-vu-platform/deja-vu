import { Component, Input } from '@angular/core';

@Component({
  selector: 'mapmit-show-group',
  templateUrl: './show-group.component.html',
  styleUrls: ['./show-group.component.css']
})
export class ShowGroupComponent {
  @Input() group: Group;
  @Input() loggedInUserId: string;
}

interface Group {
  id: string;
  memberIds: string[];
  subgroups: Group[]
};
