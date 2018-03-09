import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges, Type
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';
import { RatingService, RatingServiceFactory } from '../shared/rating.service';

import { take } from 'rxjs/operators';

import * as _ from 'lodash';


@Component({
  selector: 'rating-rate-target',
  templateUrl: './rate-target.component.html',
  styleUrls: ['./rate-target.component.css']
})
export class RateTargetComponent implements
  OnInit, OnChanges, OnRun, OnAfterAbort {
  @Input() sourceId: string;
  sourceIdChange = new EventEmitter<void>();
  @Input() targetId: string;
  targetIdChange = new EventEmitter<void>();

  @Output() rating = new EventEmitter<number>();

  prevRatingValue: number;
  ratingValue: number;
  ratingService: RatingService;

  constructor(
    private elem: ElementRef,  private rs: RunService,
    private rsf: RatingServiceFactory) {}

  ngOnInit() {
    this.ratingService = this.rsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadRating();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.sourceId || changes.newSourceId) {
      this.sourceIdChange.emit();
    }
    if (changes.targetId || changes.newTargetId) {
      this.targetIdChange.emit();
    }
    this.loadRating();
  }

  updateRating($event) {
    this.prevRatingValue = this.ratingValue;
    this.ratingValue = $event.rating;
    this.rs.run(this.elem);
  }

  /**
   * Sync the rating on the server with the rating on the client.
   */
  async dvOnRun() {
    if (this.sourceId === undefined) {
      await this.sourceIdChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    if (this.targetId === undefined) {
      await this.targetIdChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    const res = await this.ratingService.post<{data: any}>(`
        updateRating(
          sourceId: "${this.sourceId}",
          targetId: "${this.targetId}",
          newRating: ${this.ratingValue})
      `)
      .toPromise();
    this.rating.emit(this.ratingValue);
  }

  dvOnAfterAbort() {
    this.ratingValue = this.prevRatingValue;
    this.rating.emit(this.ratingValue);
  }

  /**
   * Load a rating from the server (if any), and set the value of the widget.
   */
  async loadRating() {
    if (!this.sourceId || !this.targetId || !this.ratingService) {
      return;
    }
    this.ratingValue = await this.ratingService
      .ratingBySourceTarget(this.sourceId, this.targetId);
    this.rating.emit(this.ratingValue);
  }
}
