import { Component, Input } from '@angular/core';

import { Target } from '../shared/ranking.model';


@Component({
  selector: 'ranking-show-target',
  templateUrl: './show-target.component.html',
  styleUrls: ['./show-target.component.css']
})
export class ShowTargetComponent {
  @Input() target: Target;

  @Input() showId = true;
  @Input() showRank = true;

  @Input() rankLabel = 'Rank: ';
}
