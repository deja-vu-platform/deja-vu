import { Component, Input } from '@angular/core';

@Component({
  selector: 'group-show-member',
  templateUrl: './show-member.component.html',
  styleUrls: ['./show-member.component.css']
})
export class ShowMemberComponent {
  @Input() id: string | undefined;
}
