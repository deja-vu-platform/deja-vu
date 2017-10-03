import { Component, Input, Output, EventEmitter} from '@angular/core';

enum ZoomType {
  SLIDER, FIT, FULL, ACTUAL
}

export interface Dimensions {
    width: number;
    height: number;
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
  @Input() outerContainerDimensions: Dimensions = {
    width: 10,
    height: 20
  };
  @Input() widgetDimensions: Dimensions = {
    width: 10,
    height: 20
  };
  @Input() screenDimensions: Dimensions = {
    width: 10,
    height: 20
  };

  @Output() updatedZoom = new EventEmitter<number>();

  readonly sliderMinVal = -300;
  readonly sliderMaxVal = 300;
  zoomControlText = '100%';
  sliderVal = 0;
  minimized = false;
  chevron = CHEVRON.RIGHT;
  ZoomType = ZoomType;

  private currentZoom: number;

  private getSliderValFromZoom(zoom: number): number {
    let val: number;
    if (zoom === 1) {
        val = 0;
    } else if ( zoom > 1 ) {
        val = (zoom - 1) * 100;
    } else {
        val = (zoom - 1) * (this.sliderMinVal + 100);
    }
    // rounding for extremes
    val = Math.max(Math.min(val, this.sliderMaxVal), this.sliderMinVal);
    return Math.round(val);
  }

  private getZoomFromSliderVal(): number {
    const val = this.sliderVal / 100;
    let zoom;

    if (val === 0) {
        zoom = 1;
    } else if (val > 0) {
        zoom = (val + 1);
    } else {
        zoom = 1 + val / (this.sliderMaxVal / 100 + 1);
    }
    console.log(zoom);
    return zoom;
  }

  private makeZoomText(zoom: number): string {
    return Math.round(zoom * 100) + '%';
  }

  changeZoomViaZoomControl(type: ZoomType) {
    switch (type) {
    case ZoomType.SLIDER:
        // TODO make this better
        const zoom = this.getZoomFromSliderVal();
        this.zoomControlText = this.makeZoomText(zoom);
        this.currentZoom = zoom;
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
        this.changeZoomViaZoomControl(ZoomType.SLIDER);
        break;
    }
    this.changeZoomDisplays();
  }



  /**
   * Changes the displays related to zoom
   *
   * @param zoom
   */
  private changeZoomDisplays() {
    this.zoomControlText = this.makeZoomText(this.currentZoom);
    this.sliderVal = this.getSliderValFromZoom(this.currentZoom);

    // // update zoom nav displays
    // $('#selected-screen-size').css({
    //     height: selectedScreenSizeHeight*currentZoom + 'px',
    //     width: selectedScreenSizeWidth*currentZoom + 'px',
    // });
    // $('#zoom-selected-screen-size').css({
    //     height: selectedScreenSizeHeight*currentZoom*miniNav.getNavZoom() + 'px',
    //     width: selectedScreenSizeWidth*currentZoom*miniNav.getNavZoom() + 'px',
    // });
    // $('.'+workSurfaceRef).css({
    //     width: outerWidget.properties.dimensions.width*zoom + 'px',
    //     height: outerWidget.properties.dimensions.height*zoom + 'px',
    // });
  }

  zoomButtonClick(type: ZoomType) {
    this.changeZoomViaZoomControl(type);
  }

  zoomClick(e: MouseEvent, out: boolean) {
    e.preventDefault();
    const diff = out ? -100 : 100;
    this.sliderVal = Math.round(this.sliderVal / 100) * 100 + diff;
    this.changeZoomViaZoomControl(ZoomType.SLIDER);
  }

  zoomSliderInput(newVal: number) {
    this.sliderVal = newVal;
    this.changeZoomViaZoomControl(ZoomType.SLIDER);
}

  zoomSliderChange() {
    this.updatedZoom.emit(this.currentZoom);
    this.zoomControlText = this.makeZoomText(this.getZoomFromSliderVal());
  }


  minimize() {
    if (this.minimized) {
        this.minimized = false;
        this.chevron = CHEVRON.RIGHT;
    } else {
        this.minimized = true;
        this.chevron = CHEVRON.LEFT;
    }
  }

//   registerZoom() {
//     $('#zoom-slider').unbind().on('change', function(){
//         this.changeZoomViaZoomControl('slider');
//     });
//   }

}
