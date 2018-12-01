import { Component, Input } from '@angular/core';


@Component({
  selector: 'dv-if',
  templateUrl: './if.component.html'
})
export class IfComponent {
  @Input() condition: boolean | undefined;
}
