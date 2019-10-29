import { Component, Input } from '@angular/core';
import { Publisher } from '../shared/follow.model';

@Component({
  selector: 'follow-show-publisher',
  templateUrl: './show-publisher.component.html',
  styleUrls: ['./show-publisher.component.css']
})
export class ShowPublisherComponent {
  @Input() publisher: Publisher;
}
