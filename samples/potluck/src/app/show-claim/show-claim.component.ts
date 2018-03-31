import { Component, Input } from '@angular/core';

@Component({
  selector: 'potluck-show-claim',
  templateUrl: './show-claim.component.html',
  styleUrls: ['./show-claim.component.css']
})
export class ShowClaimComponent {
  @Input() id: any;
  claim: any;
}
