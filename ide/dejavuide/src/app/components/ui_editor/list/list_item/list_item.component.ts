
import { Component, Input, AfterViewInit, ElementRef, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material';

import { Cliche, ClicheMap } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget, UserWidget } from '../../../../models/widget/widget';
import { DeleteDialogComponent } from './delete_dialog.component';
import { ProjectService } from '../../../../services/project.service';
// import { WidgetComponent } from '../../widget/widget.component';

// List item needs drag-and-drop
import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;


@Component({
  selector: 'dv-list-item',
  templateUrl: './list_item.component.html',
  styleUrls: ['./list_item.component.css']
})
export class ListItemComponent implements AfterViewInit {
  @Input() isDraggable = false;
  @Input() isDeletable = true;
  @Input() widget: Widget;
  @ViewChild('ghost', {read: ElementRef}) ghost: ElementRef;
  dragging = false;
  innerShown = false;
  allCliches: ClicheMap;
  el: HTMLElement;

  constructor(
    el: ElementRef,
    public dialog: MatDialog,
    private projectService: ProjectService
  ) {
    this.el = el.nativeElement;
    projectService.allCliches.subscribe((updatedAllCliches) => {
      this.allCliches = updatedAllCliches;
    });
  }

  ngAfterViewInit() {
    if (this.isDraggable) {
      $(this.el).draggable(
        { opacity: 1,
          revert: 'invalid',
          cursorAt: {top: 0, left: 0},
          helper: (e, ui) => {
              const widgetContainer = $(this.ghost.nativeElement).clone();
              widgetContainer.css({
                display: 'block',
                visibility: 'visible',
              });
              return widgetContainer;
          },
          appendTo: '.edit',
          cursor: '-webkit-grabbing',
          scroll: true,
          snap: '.grid-cell, .grid-x, .grid-y',
          snapTolerance: 10,
          start: () => {
              // $('.grid').css({
              //     visibility: 'visible'
              // });
              // $('.grid-line').css({
              //     visibility: 'hidden'
              // });
              this.dragging = true;
          },
          drag: (event, ui) => {
              // grid.detectGridLines(ui.helper);
          },
          stop: (event, ui) => {
              // $('.grid').css({
              //     visibility: 'hidden'
              // });
              // $('.grid-line').css({
              //     visibility: 'hidden'
              // });
              // var widgetId = draggingWidget.meta.id;
              // var isNewWidget = $(ui.helper).data('newcomponent');
              // if (!isNewWidget) {
              //     var widgetContainerOld = $('#'+containerRef+'_' + widgetId + '_old');
              //     if (!$(ui.helper).data('dropped')) {// not properly dropped!
              //         widgetContainerOld.attr('id', containerRef+'_' + widgetId);
              //         widgetContainerOld.css({
              //             opacity: 1,
              //         });
              //     } else { // properly dropped
              //         widgetContainerOld.remove();
              //     }
              // } else {
              //     delete userApp.widgets.unused[widgetId];
              //     $("#user-components-list").find("[data-componentid='" + widgetId + "']").remove();
              // }
              // listDisplay.refresh();
              this.dragging = false;
          }
      });
    }
  }

  handleDelete(): void {
    if (this.isDeletable) {
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '250px',
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.deleteUserWidget();
        }
      });
    }
  }

  toggleShow() {
    this.innerShown = !this.innerShown;
  }

  private deleteUserWidget() {
    console.log('clicked delete');
    // if (userApp.getNumWidgets() == 1){
    //     return; //don't delete the last one TODO is the the right way to go?
    // }
    // userApp.deleteWidget(userWidgetId);
    // var workSurfaceRef = workSurface.getWorkSurfaceRef();

    // $('#'+workSurfaceRef+'_'+userWidgetId).remove();
    // $('#disabled_'+userWidgetId+'_'+workSurfaceRef+'_'+userWidgetId).remove(); // also remove disabled ones

    // if (userWidgetId == selectedUserWidget.meta.id){ // strings will also do
    //     var otherIds = userApp.getAllWidgetIds();
    //     selectedUserWidget = userApp.getWidget(otherIds[0]);
    //     workSurface.loadUserWidget(selectedUserWidget, currentZoom);
    // }
    // if (userWidgetId == userApp.widgets.indexId){
    //     userApp.widgets.indexId = null;
    // }
    // listDisplay.refresh();
  }

  // that.select = function(id){
  //     $('.selected').removeClass("selected");
  //     $("[data-componentid='" + id + "']").addClass('selected');
  // };
}
