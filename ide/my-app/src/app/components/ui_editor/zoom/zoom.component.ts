import { Component, Input, Output, EventEmitter} from '@angular/core';

import {Dimensions} from '../../common/utility/utility';

enum ZoomType {
  SLIDER, FIT, FULL, ACTUAL
}

const CHEVRON = {
    LEFT: 'glyphicon glyphicon-chevron-left',
    RIGHT: 'glyphicon glyphicon-chevron-right'
};

@Component({
  selector: 'dv-zoom',
  templateUrl: './zoom.component.html',
  styleUrls: ['./zoom.component.css']
})
export class ZoomComponent {
  @Input() outerContainerDimensions: Dimensions;
  @Input() widgetDimensions: Dimensions;
  @Input() screenDimensions: Dimensions;

  @Output() updatedZoom = new EventEmitter<number>();

  readonly sliderMinVal = -300;
  readonly sliderMaxVal = 300;
  zoomControlText = '100%';
  sliderVal = 0;
  minimized = false;
  chevron = CHEVRON.RIGHT;
  ZoomType = ZoomType;

  private currentZoom: number;

  zoomTypeButtonClick(type: ZoomType) {
    this.changeZoomViaZoomControl(type);
    this.sliderVal = this.getSliderValFromZoom(this.currentZoom);
    this.zoomChanged();
  }

  zoomButtonClick(e: MouseEvent, out: boolean) {
    e.preventDefault();
    const diff = out ? -100 : 100;
    this.sliderVal = Math.round(this.sliderVal / 100) * 100 + diff;
    this.changeZoomViaZoomControl(ZoomType.SLIDER);
    this.zoomChanged();
  }

  zoomSliderInput(newVal: number) {
    this.sliderVal = newVal;
    this.changeZoomViaZoomControl(ZoomType.SLIDER);
    this.zoomChanged();
  }

  private changeZoomViaZoomControl(type: ZoomType) {
    switch (type) {
    case ZoomType.SLIDER:
        this.currentZoom = this.getZoomFromSliderVal();
        break;
    case ZoomType.FIT:
        const zoomHeight = this.outerContainerDimensions.height /
                                this.widgetDimensions.height;
        const zoomWidth = this.outerContainerDimensions.width /
                                this.widgetDimensions.width;
        this.currentZoom = Math.min(zoomWidth, zoomHeight);
        break;
    case ZoomType.FULL:
        const widthScale =  this.outerContainerDimensions.width /
                                this.screenDimensions.width;
        const heightScale = this.outerContainerDimensions.height /
                                this.screenDimensions.height;
        this.currentZoom = Math.min(widthScale, heightScale);
        break;
    case ZoomType.ACTUAL:
        this.sliderVal = 0;
        this.currentZoom = 1;
        break;
    }

    // clip for extremes
    this.currentZoom = Math.max(Math.min(this.currentZoom, 4), .25);
  }

  private getSliderValFromZoom(zoom: number): number {
    // TODO make this better? Currently < 0 is a linear scale
    // whereas > 0 is exp scale
    let val: number;
    if (zoom === 1) {
        val = 0;
    } else if ( zoom > 1 ) {
        val = (zoom - 1) * 100;
    } else {
        val = (zoom - 1) * (this.sliderMaxVal + 100);
    }
    return Math.round(val);
  }

  private getZoomFromSliderVal(): number {
    // TODO make this better? Currently < 0 is a linear scale
    // whereas > 0 is exp scale
    const val = this.sliderVal;
    let zoom: number;

    if (val === 0) {
        zoom = 1;
    } else if (val > 0) {
        zoom = (val + 100) / 100;
    } else {
        zoom = 1 + val / (this.sliderMaxVal + 100);
    }
    return zoom;
  }

  private makeZoomText(zoom: number): string {
    return Math.round(zoom * 100) + '%';
  }

  private zoomChanged() {
    this.updatedZoom.emit(this.currentZoom);
    this.zoomControlText = this.makeZoomText(this.getZoomFromSliderVal());
  }

  private minimize() {
    if (this.minimized) {
        this.minimized = false;
        this.chevron = CHEVRON.RIGHT;
    } else {
        this.minimized = true;
        this.chevron = CHEVRON.LEFT;
    }
  }
}
