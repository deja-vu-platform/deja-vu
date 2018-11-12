import { Component, Input } from '@angular/core';

@Component({
  selector: 'chorestar-create-chore',
  templateUrl: './create-chore.component.html',
  styleUrls: ['./create-chore.component.css']
})
export class CreateChoreComponent {
  @Input() user;
}
