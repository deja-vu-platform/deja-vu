import { Component, Input } from '@angular/core';

import { UserWidget } from '../../../models/widget/widget';

@Component({
  selector: 'dv-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css'],
})
export class GridComponent {
  @Input() selectedPage: UserWidget;

  private xsWithoutBoundary = [];
  private ysWithoutBoundary = [];

  private xs = [];
  private ys = [];

  setUpGrid(workSurfaceElt) {
    // TODO this should be able to be done based on the userWidget!

    $('.grid').remove();

    const grid = { x: {}, y: {} };
    this.selectedPage.getInnerWidgetIds().forEach(innerWidgetId => {
      const innerWidget = this.selectedPage.getInnerWidget(innerWidgetId);
      // existing components should also be in the work surface!
      const top = 'container.position().top';
      const left = 'container.position().left';
      const right = 'left + container.width()';
      const bottom = 'top + container.height()';
      grid.x[left] = '';
      grid.x[right] = '';
      grid.y[top] = '';
      grid.y[bottom] = '';
    });

    const workSurfaceTop = 0;
    const workSurfaceBottom = workSurfaceTop + workSurfaceElt.height();
    const workSurfaceLeft = 0;
    const workSurfaceRight = workSurfaceLeft + workSurfaceElt.width();

    this.xsWithoutBoundary.push(workSurfaceLeft, workSurfaceRight);
    this.ysWithoutBoundary.push(workSurfaceTop, workSurfaceBottom);

    // TODO make more elegant
    // get the sets of xs and ys
    this.xsWithoutBoundary = Object.keys(grid.x).map(function (key) {
      return parseFloat(key);
    });
    this.xsWithoutBoundary.sort(this.comparator);

    this.ysWithoutBoundary = Object.keys(grid.y).map(function (key) {
      return parseFloat(key);
    });

    this.ysWithoutBoundary.sort(this.comparator);

    grid.x[workSurfaceLeft] = '';
    grid.x[workSurfaceRight] = '';
    grid.y[workSurfaceTop] = '';
    grid.y[workSurfaceBottom] = '';

    // get the sets of xs and ys
    this.xs = Object.keys(grid.x).map(function (key) {
      return parseFloat(key);
    });
    this.xs.sort(this.comparator);

    this.ys = Object.keys(grid.y).map(function (key) {
      return parseFloat(key);
    });
    this.ys.sort(this.comparator);

    const gridElt = $('<div></div>');
    gridElt.addClass('grid');

    const numXs = this.xs.length;
    const numYs = this.ys.length;

    for (let xNum = 0; xNum < numXs; xNum++) {
      const xElt = $('<div></div>');
      xElt.addClass('grid-x grid-line');
      xElt.attr('id', 'grid-x_' + xNum);
      gridElt.append(xElt);
      xElt.css({
        position: 'absolute',
        height: workSurfaceElt.height(),
        width: '1px',
        top: 0,
        left: this.xs[xNum],
        border: '1px dashed black'
      });
    }

    for (let yNum = 0; yNum < numYs; yNum++) {
      const yElt = $('<div></div>');
      yElt.addClass('grid-y grid-line');
      yElt.attr('id', 'grid-y_' + yNum);
      gridElt.append(yElt);
      yElt.css({
        position: 'absolute',
        height: '1px',
        width: workSurfaceElt.width(),
        top: this.ys[yNum],
        left: 0,
        border: '1px dashed black'
      });
    }
    gridElt.css({
      position: 'absolute',
      top: 0,
      left: 0,
      visibility: 'hidden',
    });
    workSurfaceElt.append(gridElt);
  }

  detectGridLines(container) {
    $('.grid-line').css({
      visibility: 'hidden'
    });

    const top = container.position().top;
    const bottom = top + container.height();
    const left = container.position().left;
    const right = left + container.width();

    const OFFSET = 10;
    const minLeft = left - OFFSET;
    const maxLeft = left + OFFSET;
    const minRight = right - OFFSET;
    const maxRight = right + OFFSET;
    const minTop = top - OFFSET;
    const maxTop = top + OFFSET;
    const minBottom = bottom - OFFSET;
    const maxBottom = bottom + OFFSET;

    for (let idx = 0; idx < this.xs.length; idx++) {
      const x = this.xs[idx];
      if ((minLeft <= x) && (maxLeft >= x) || (minRight <= x) && (maxRight >= x)) {
        $('#grid-x_' + idx).css({
          visibility: 'visible'
        });
      }
    }

    for (let idx = 0; idx < this.ys.length; idx++) {
      const y = this.ys[idx];
      if ((minTop <= y) && (maxTop >= y) || (minBottom <= y) && (maxBottom >= y)) {
        $('#grid-y_' + idx).css({
          visibility: 'visible'
        });
      }
    }
  }

  getLeftMostGridPosition () {
    const len = this.xsWithoutBoundary.length;
    if (len > 0) {
      return this.xs[0];
    }
    return false;
  }

  getRightMostGridPosition() {
    const len = this.xsWithoutBoundary.length;
    if (len > 0) {
      return this.xsWithoutBoundary[len - 1];
    }
    return false;
  }

  getTopMostGridPosition() {
    const len = this.ysWithoutBoundary.length;
    if (len > 0) {
      return this.ysWithoutBoundary[0];
    }
    return false;
  }

  getBottomMostGridPosition () {
    const len = this.ysWithoutBoundary.length;
    if (len > 0) {
      return this.ysWithoutBoundary[len - 1];
    }
    return false;
  }

  private comparator(a, b) {
    return a - b;
  }
}
