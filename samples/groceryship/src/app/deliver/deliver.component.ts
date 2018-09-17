import { Component, OnInit } from '@angular/core';
import {
  ShowDeliverRequestComponent
} from '../show-deliver-request/show-deliver-request.component';

@Component({
  selector: 'groceryship-deliver',
  templateUrl: './deliver.component.html',
  styleUrls: ['./deliver.component.css']
})
export class DeliverComponent implements OnInit {
  showDeliverRequest = ShowDeliverRequestComponent;

  constructor() { }

  ngOnInit() {
  }

}
