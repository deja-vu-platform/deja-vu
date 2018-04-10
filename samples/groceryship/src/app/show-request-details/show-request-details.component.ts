import { Component, Input } from '@angular/core';


@Component({
  selector: 'groceryship-show-request-details',
  templateUrl: './show-request-details.component.html',
  styleUrls: ['./show-request-details.component.css']
})
export class ShowRequestDetailsComponent {
  @Input() request: any;
  @Input() myRequest: boolean; // whether it was made by the current user
  @Input() showTransactionSummary: boolean = true;
}
