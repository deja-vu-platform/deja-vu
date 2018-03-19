import { Component, OnInit } from '@angular/core';

import { ShowPartyComponent } from '../show-party/show-party.component';


@Component({
  selector: 'potluck-show-parties',
  templateUrl: './show-parties.component.html',
  styleUrls: ['./show-parties.component.css']
})
export class ShowPartiesComponent implements OnInit {
  user: any;
  showParty = ShowPartyComponent;

  constructor() { }

  ngOnInit() {
  }
}
