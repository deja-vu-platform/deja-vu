import { Component } from '@angular/core';

import { StateService } from '../../../services/state.service';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'dv-ui-editor-zoom',
  templateUrl: './ui-editor-zoom.component.html',
})
export class UiEditorZoomComponent {
  private widgetDimensions;

  constructor(
    private stateService: StateService,
    private projectService: ProjectService
  ) {
    this.widgetDimensions = projectService.selectedWidget.map(
        (newWidget) => newWidget.getDimensions());
  }


  private zoomChanged(zoom: number) {
    this.stateService.updateZoom(zoom);
  }
}
