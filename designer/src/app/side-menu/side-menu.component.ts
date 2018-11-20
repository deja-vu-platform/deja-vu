import { Component, Input } from '@angular/core';
import { Cliche } from '../datatypes';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent {
  @Input() cliches: Cliche[];
}
