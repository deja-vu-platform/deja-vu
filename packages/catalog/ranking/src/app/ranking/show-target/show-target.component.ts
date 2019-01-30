import { Component, Input } from '@angular/core';

import { TargetRank } from '../shared/ranking.model';


@Component({
  selector: 'ranking-show-target',
  templateUrl: './show-target.component.html',
  styleUrls: ['./show-target.component.css']
})
export class ShowTargetComponent {
  @Input() target: TargetRank;

  @Input() showId = true;
  @Input() showRank = true;

  @Input() rankLabel = 'Rank: ';
}
