import { Component, Input } from '@angular/core';

@Component({
  selector: 'potluck-show-supply',
  templateUrl: './show-supply.component.html',
  styleUrls: ['./show-supply.component.css']
})
export class ShowSupplyComponent {
  @Input() supply: any;
  @Input() id: any;
  @Input() useIdForObject = false;
}
