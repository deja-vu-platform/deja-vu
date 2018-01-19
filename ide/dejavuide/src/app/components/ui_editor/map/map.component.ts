import { Component, AfterViewInit, OnInit, ElementRef, ChangeDetectorRef} from '@angular/core';

import { Widget, UserWidget } from '../../../models/widget/widget';
import { StateService, Dimensions, Position } from '../../../services/state.service';
import { ProjectService } from '../../../services/project.service';

// Maps needs drag-and-drop
import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;

@Component({
  selector: 'dv-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, OnInit {
  /**
   * This is a box corresponding to the visible window of the user's
   * work surface to show where the user is.
   *
   * Not saving a scaled version because the map scale might not be correct
   * when this is set.
   */
  visibleWindowDimensions: Dimensions = {
    height: 0,
    width: 0
  };

  selectedWidget: Widget;
  mapScale = 0.1;
  mapVisibleWindowPosition: Position = {
    top: 0,
    left: 0
  };

  screenDimensions: Dimensions;
  mapComponentDimensions: Dimensions = {
    height: 100,
    width: 100
  };

  minimized = false;
  mapSelectedWidgetSize: Dimensions;
  mapSelectedWidgetPosition: Position;
  mapWidgetSizes: Dimensions[] = [];

  private zoom = 1;
  private el: HTMLElement;

  constructor(
    el: ElementRef,
    private stateService: StateService,
    private projectService: ProjectService,
    private ref: ChangeDetectorRef
  ) {
    this.el = el.nativeElement;
    stateService.zoom.subscribe((newZoom) => {
      this.zoom = newZoom;
    });

    stateService.selectedScreenDimensions
      .subscribe((newSelectedScreenDimensions) => {
        this.screenDimensions = newSelectedScreenDimensions;
        this.updateMapScale();
        this.updateView();
      });
  }

  ngOnInit() {
    this.mapComponentDimensions.height = this.el.offsetHeight;
    this.mapComponentDimensions.width = this.el.offsetWidth;
    this.updateMapScale();
    this.updateView();

    this.stateService.visibleWindowScrollPosition
    .subscribe((newVisibleWindowScrollPosition) => {
      this.mapVisibleWindowPosition.top =
        newVisibleWindowScrollPosition.top * this.mapScale;
      this.mapVisibleWindowPosition.left =
        newVisibleWindowScrollPosition.left * this.mapScale;
    });

    this.projectService.selectedWidget.subscribe((newSelectedWidget) => {
    this.selectedWidget = newSelectedWidget;
    this.updateView();
  });

    this.projectService.widgetUpdateListener.subscribe(() => {
      this.updateView();
      this.ref.detectChanges();
    });

    this.stateService.visibleWindowDimensions.subscribe(
      (newVisibleWindowDimensions) => {
          this.visibleWindowDimensions = newVisibleWindowDimensions;
    });
  }

  ngAfterViewInit() {
    this.makeMapDraggable();
  }

  minimizeButtonClick() {
    this.minimized = !this.minimized;
  }

  /**
   * Updates the position of the little screen element to start at the place
   * that was clicked, and also changes the window's scroll to match.
   * @param e
   */
  mapClick(e: MouseEvent) {
    const posX = e.pageX - $('#map').offset().left + $('#map').scrollLeft();
    const posY = e.pageY - $('#map').offset().top + $('#map').scrollTop();
    this.stateService.updateVisibleWindowScrollPosition({
      top: posY / this.mapScale,
      left: posX / this.mapScale
    });

    const top =  Math.max(0,
      Math.min(posY,
        (this.screenDimensions.height -
          this.visibleWindowDimensions.height) * this.mapScale));
    const left =  Math.max(0,
      Math.min(posX,
        (this.screenDimensions.width -
          this.visibleWindowDimensions.width) * this.mapScale));

    this.mapVisibleWindowPosition = {
      top: top,
      left: left
    };
  }

  /**
   * Update the view of the map fresh from the info of the given widget.
   */
  private updateView() {
    const selectedWidget = this.selectedWidget;
    const userApp = this.projectService.getProject().getUserApp();
    if (selectedWidget) {
      this.mapSelectedWidgetSize = {
        height: selectedWidget.getDimensions().height * this.mapScale,
        width: selectedWidget.getDimensions().width * this.mapScale
      };
      this.mapSelectedWidgetPosition = {
        top: selectedWidget.getPosition().top * this.mapScale,
        left: selectedWidget.getPosition().left * this.mapScale
      };

      const mapWidgetSizes = [];
      if (selectedWidget.isUserType()) {
        selectedWidget.getInnerWidgetIds().forEach((innerWidgetId) => {
          const innerWidget = selectedWidget
                                .getInnerWidget(userApp, innerWidgetId);
          const innerWidgetDimensions = innerWidget.getDimensions();
          const innerWidgetPosition = innerWidget.getPosition();
          mapWidgetSizes.push({
            left: innerWidgetPosition.left * this.mapScale,
            top: innerWidgetPosition.top * this.mapScale,
            width: innerWidgetDimensions.width * this.mapScale,
            height: innerWidgetDimensions.height * this.mapScale,
          });
        });
      }

      this.mapWidgetSizes = mapWidgetSizes;
    }
  }

  /**
   * Updates the scale of the map so that the ratio of the <TODO>
   * @param e
   */
  private updateMapScale() {
    const widthScale =
    this.mapComponentDimensions.width / this.screenDimensions.width;
    const heightScale =
      this.mapComponentDimensions.height / this.screenDimensions.height;

    this.mapScale = Math.min(widthScale, heightScale);
  }

  private makeMapDraggable() {
    $('#map-window').draggable({
      containment: '#zoom-selected-screen-size',
      drag: (e, ui) => {
        this.stateService.updateVisibleWindowScrollPosition({
          top: ui.position.top / this.mapScale,
          left: ui.position.left / this.mapScale
        });
      },
      stop: (e, ui) => {
        this.stateService.updateVisibleWindowScrollPosition({
          top: ui.position.top / this.mapScale,
          left: ui.position.left / this.mapScale
        });
      },
    });
  }
}
