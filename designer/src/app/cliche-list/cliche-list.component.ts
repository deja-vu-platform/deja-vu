import { Component, Input } from '@angular/core';
import { Cliche } from '../datatypes';

@Component({
  selector: 'app-cliche-list',
  templateUrl: './cliche-list.component.html',
  styleUrls: ['./cliche-list.component.scss'],
})
export class ClicheListComponent {
  @Input() cliches: Cliche[];
}
