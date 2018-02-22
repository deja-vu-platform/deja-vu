import { Injectable } from '@angular/core';
// BehaviorSubject as opposed to Subject since we want an initial value right
// upon subscription
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Dimensions, Position } from '../../../utility/utility';

@Injectable()
export class StateService {
  /**
   * This is the visible part of the worksurface.
   */
  visibleWindowDimensions = new BehaviorSubject<Dimensions>({
    width: 800,
    height: 500
  });

  /**
   * Related to the visible part of the worksurface, it is its current
   * scroll position.
   */
  visibleWindowScrollPosition = new BehaviorSubject<Position>({
    top: 0,
    left: 0
  });

  /**
   * This is the screen size the user is making an app for. This currently does
   * not play a big role in this app.
   */
  selectedScreenDimensions = new BehaviorSubject<Dimensions>({
    width: 2000,
    height: 1000
  });

  zoom = new BehaviorSubject<number>(1);

  updateVisibleWindowDimensions(newDims: Dimensions) {
    this.visibleWindowDimensions.next(newDims);
  }

  updateVisibleWindowScrollPosition(newPos: Position) {
    this.visibleWindowScrollPosition.next(newPos);
  }

  updateSelectedScreenDimensions(newDims: Dimensions) {
    this.selectedScreenDimensions.next(newDims);
  }

  updateZoom(newVal: number) {
    this.zoom.next(newVal);
  }
}
