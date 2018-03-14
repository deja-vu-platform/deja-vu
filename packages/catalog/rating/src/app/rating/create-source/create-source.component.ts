import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import { OnRun, RunService } from 'dv-core';

import { RatingService, RatingServiceFactory } from '../shared/rating.service';


@Component({
  selector: 'rating-create-source',
  templateUrl: './create-source.component.html',
  styleUrls: ['./create-source.component.css']
})
export class CreateSourceComponent implements OnInit {
  @Input() id: string;
  @Input() buttonLabel = 'Create Source';
  @Input() inputLabel = 'Id';
  @Output() source = new EventEmitter();
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
    console.log(`Saving resource ${this.id}`);
    this.ratingService
      .createSource(this.id)
      .subscribe((source) => {
        this.source.emit({id: source.id});
      });
  }
}
