import { Component, Input } from '@angular/core';


@Component({
  selector: 'groceryship-show-profile',
  templateUrl: './show-profile.component.html',
  styleUrls: ['./show-profile.component.css']
})
export class ShowProfileComponent {
  @Input() id: string;
}
