import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import { OnRun, RunService } from 'dv-core';

import { RatingService, RatingServiceFactory } from '../shared/rating.service';


@Component({
  selector: 'rating-create-target',
  templateUrl: './create-target.component.html',
  styleUrls: ['./create-target.component.css']
})
export class CreateTargetComponent implements OnInit {
  @Input() id: string;
  @Input() buttonLabel = 'Create target';
  @Input() inputLabel = 'Id';
  @Output() target = new EventEmitter();
  private ratingService: RatingService;

  constructor(
    private elem: ElementRef,
    private asf: RatingServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.ratingService = this.asf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  dvOnRun() {
    console.log(`Saving target ${this.id}`);
    this.ratingService
      .createTarget(this.id)
      .subscribe((target) => {
        this.target.emit({id: target.id});
      });
  }
}
