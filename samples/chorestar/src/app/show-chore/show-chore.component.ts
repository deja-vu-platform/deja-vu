import { Component, Input } from '@angular/core';

@Component({
  selector: 'chorestar-show-chore',
  templateUrl: './show-chore.component.html',
  styleUrls: ['./show-chore.component.css']
})
export class ShowChoreComponent {
  @Input() chore;
  @Input() view: 'child' | 'parent' = 'parent';
  @Input() showOptionToApprove = false;
}
