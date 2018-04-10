import { Component, Input } from '@angular/core';


@Component({
  selector: 'groceryship-show-party-summary',
  templateUrl: './show-party-summary.component.html',
  styleUrls: ['./show-party-summary.component.css']
})
export class ShowPartySummaryComponent {
  @Input() id: string;
  @Input() showContactInfo: boolean = true;
}
