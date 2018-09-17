import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Message } from '../shared/follow.model';

@Component({
  selector: 'follow-show-message',
  templateUrl: './show-message.component.html',
  providers: [ DatePipe ]
})
export class ShowMessageComponent {
  @Input() message: Message;

  @Input() showId = true;
  @Input() showContent = true;
}
