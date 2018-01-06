
import { Component, Input, AfterViewInit, ElementRef, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget, UserWidget, LinkBaseWidget } from '../../../../models/widget/widget';
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
  @Input() createNew = false;
  @Input() isTemplate = false;
  @Input() widget: Widget;
  @ViewChild('ghost', {read: ElementRef}) ghost: ElementRef;
  dragging = false;
  innerShown = false;
  renameVisible = false;
  el: HTMLElement;

  constructor(
    el: ElementRef,
    public dialog: MatDialog,
    private projectService: ProjectService
  ) {
    this.el = el.nativeElement;
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
          appendTo: '.work-surface',
          cursor: '-webkit-grabbing',
          scroll: true,
          snap: '.grid-cell, .grid-x, .grid-y',
          snapTolerance: 10,
          start: (e, ui) => {
              // $('.grid').css({
              //     visibility: 'visible'
              // });
              // $('.grid-line').css({
              //     visibility: 'hidden'
              // });
              ui.helper.dvWidget = this.widget;
              ui.helper.new = this.createNew;
              ui.helper.template = this.isTemplate;
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

  widgetSelected() {
    console.log('widget clicked');
    this.projectService.updateSelectedWidget(this.widget);
  }

  rename(event) {
    this.widget.setName(event.target.value);
    this.projectService.widgetUpdated();
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


// $('.components').on('click', '.component-name-container', function () {
//   // Save the current values
//   var oldState = {zoom : currentZoom};
//   var workSurfaceRef = workSurface.getWorkSurfaceRef();
//   $('#'+workSurfaceRef+'_'+selectedUserWidget.meta.id).data('state', oldState);
//   dragAndDrop.registerWidgetDragHandleDraggable();
//   var widgetId = $(this).closest('.widget').data('componentid');
//   listDisplay.select(widgetId);
//   selectedUserWidget = userApp.getWidget(widgetId);
//   listDisplay.updateDraggables(selectedUserWidget);
//   workSurface.loadUserWidget(selectedUserWidget);
//   style.setUpStyleColors(selectedUserWidget);
//   $('#outer-container').scrollTop(0); // TODO DRY
//   $('#outer-container').scrollLeft(0);

// });

// $('.components').on('dblclick', '.component-name', function (e) {
//   var newNameInputElt = $($(this).parent().find('.new-name-input'));
//   var submitRenameElt = $($(this).parent().find('.submit-rename'));
//   newNameInputElt.val($(this).text());
//   submitRenameElt.removeClass('not-displayed');
//   $(this).addClass('not-displayed');
//   newNameInputElt.focus();
//   newNameInputElt.select();
// });

// $('.components').on('keypress', '.new-name-input', function (event) {
//   if (event.which == 13) {
//       event.preventDefault();
//       var widgetListElt = $(this).closest('.widget');
//       var widgetId = widgetListElt.data('componentid');
//       var widgetNameElt = widgetListElt.find('.component-name');
//       var submitRenameElt = widgetListElt.closest('.widget').find('.submit-rename');

//       widgetNameElt.removeClass('not-displayed');
//       submitRenameElt.addClass('not-displayed');
//       var newName = $(this).val();
//       if (newName.length === 0) { // empty string entered, don't change the name!
//           return;
//       }
//       widgetNameElt.text(newName);
//       $('.component-options .component-name').text(newName);

//       var widget = userApp.getWidget(widgetId);
//       widget.meta.name = newName;
//   }
// });

