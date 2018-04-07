import { Component, Input } from '@angular/core';

@Component({
  selector: 'chorestar-show-reward',
  templateUrl: './show-reward.component.html',
  styleUrls: ['./show-reward.component.css']
})
export class ShowRewardComponent {
  @Input() reward;
  @Input() user;
  @Input() showOptionToPurchase = false;
}
