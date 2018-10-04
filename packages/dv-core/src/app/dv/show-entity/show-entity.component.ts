import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-show-entity',
  templateUrl: './show-entity.component.html'
})
export class ShowEntityComponent {
  @Input() entity: any;
}
