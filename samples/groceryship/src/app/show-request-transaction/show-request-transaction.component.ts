import { Component, OnInit, Input } from '@angular/core';


@Component({
  selector: 'groceryship-show-request-transaction',
  templateUrl: './show-request-transaction.component.html',
  styleUrls: ['./show-request-transaction.component.css']
})
export class ShowRequestTransactionComponent implements OnInit {
  @Input() id: string;
  name: string;

  constructor() { }

  ngOnInit() {
    this.name = this.id.endsWith('tip') ? 'Tip' : 'Item(s)';
  }
}
