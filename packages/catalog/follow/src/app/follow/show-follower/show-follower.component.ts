import { Component, Input } from '@angular/core';

@Component({
  selector: 'follow-show-follower',
  templateUrl: './show-follower.component.html',
  styleUrls: ['./show-follower.component.css']
})
export class ShowFollowerComponent {
  @Input() id: string;
}
