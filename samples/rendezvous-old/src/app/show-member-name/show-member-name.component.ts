import { Component, Input } from '@angular/core';

@Component({
  selector: 'rendezvous-show-member-name',
  templateUrl: './show-member-name.component.html',
  styleUrls: ['./show-member-name.component.css']
})
export class ShowMemberNameComponent {
  @Input() id: string;
}
