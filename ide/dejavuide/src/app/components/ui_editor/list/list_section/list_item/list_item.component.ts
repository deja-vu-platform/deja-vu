import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { Cliche, ClicheMap } from '../../../../../models/cliche/cliche';
import { Widget, BaseWidget, UserWidget, WidgetType } from '../../../../../models/widget/widget';
import { DeleteDialogComponent } from './delete_dialog.component';
import { ProjectService } from '../../../../../services/project.service';

@Component({
  selector: 'dv-list-item',
  templateUrl: './list_item.component.html',
  styleUrls: ['./list_item.component.css']
})
export class ListItemComponent implements OnInit {
  @Input() isDraggable = false;
  @Input() isDeletable = true;
  @Input() widget: Widget;

  readonly WidgetType = WidgetType;

  innerShown = false;
  allCliches: ClicheMap;
  isUserWidget = false;

  constructor(
    public dialog: MatDialog,
    private projectService: ProjectService
  ) {
    projectService.allCliches.subscribe((updatedAllCliches) => {
      this.allCliches = updatedAllCliches;
    });
  }

  ngOnInit () {
    this.isUserWidget = (<UserWidget>this.widget).getWidgetType() === WidgetType.USER_WIDGET;
  }

  handleDelete(): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '250px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUserWidget();
      }
    });
  }

  toggleShow() {
    this.innerShown = !this.innerShown;
  }

  deleteUserWidget() {
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

  // that.loadClicheIntoWidgetList = function(cliche, widgetToLoadId){
  //     var usedWidgetsIds = cliche.getAllUsedWidgetIds();
  //     var userAppId = userApp.meta.id;
  //     var clicheId = cliche.meta.id;
  //     if (clicheId == userAppId){
  //         userApp.getAllOuterWidgetIds().forEach(function(widgetId){
  //             var widget;
  //             if (widgetId in userApp.widgets.pages){
  //                 widget = userApp.widgets.pages[widgetId];
  //                 displayNewWidgetInMainPagesList(widget, clicheId);
  //             } else if (widgetId in userApp.widgets.unused){
  //                 widget = userApp.widgets.unused[widgetId];
  //                 displayUnusedWidgetInList(widget, clicheId);
  //             } else if (widgetId in userApp.widgets.templates) {
  //                 widget = userApp.widgets.templates[widgetId];
  //                 displayNewWidgetTemplateInList(widget, clicheId);
  //             }
  //         });
  //         if (widgetToLoadId){
  //             that.select(widgetToLoadId);
  //         }
  //         usedWidgetsIds.forEach(function(id){
  //             var widget = cliche.getWidget(id);
  //             if (widget.type == 'user'){
  //                 displayUsedWidgetInList(widget, clicheId);
  //             }
  //         });

  //     } else {
  //         // TODO
  //     }
  // };

  // /**
  //  * Adds a component to the list of user components
  //  * @param newComponent
  //  */
  // var displayUnusedWidgetInList = function(widget, clicheId){
  //     var name = widget.meta.name;
  //     var id = widget.meta.id;

  //     var hasChildren = !$.isEmptyObject(widget.innerWidgets);
  //     var newWidgetElt = createListElt(id, name, clicheId, hasChildren, true, true, false);

  //     $('#user-components-list').append(newWidgetElt);
  //     addDeleteUserWidgetButton(id, newWidgetElt);
  //     dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
  //     recursivelyLoadWidgetIntoList(widget, clicheId, newWidgetElt);
  // };

  // var displayUsedWidgetInList = function(widget, clicheId){
  //     var name = widget.meta.name;
  //     var id = widget.meta.id;

  //     var hasChildren = !$.isEmptyObject(widget.innerWidgets);
  //     var newWidgetElt = createListElt(id, name, clicheId, hasChildren, false, true, false);

  //     $('#user-used-components-list').append(newWidgetElt);
  //     addDeleteUserWidgetButton(id, newWidgetElt);
  //     recursivelyLoadWidgetIntoList(widget, clicheId, newWidgetElt);
  // };


  // /**
  //  * Adds a component to the list of main pages
  //  * @param newComponent
  //  */
  // var displayNewWidgetInMainPagesList = function(widget, clicheId){
  //     var name = widget.meta.name;
  //     var id = widget.meta.id;

  //     var hasChildren = !$.isEmptyObject(widget.innerWidgets);
  //     var newWidgetElt = createListElt(id, name, clicheId, hasChildren, false, true, true);


  //     $('#main-pages-list').append(newWidgetElt);
  //     addDeleteUserWidgetButton(id, newWidgetElt);
  //     recursivelyLoadWidgetIntoList(widget, clicheId, newWidgetElt);
  // };

  // var displayNewWidgetTemplateInList = function(widget, clicheId){
  //     var name = widget.meta.name;
  //     var id = widget.meta.id;

  //     var hasChildren = !$.isEmptyObject(widget.innerWidgets);
  //     var newWidgetElt = createListElt(id, name, clicheId, hasChildren, true, true, false);

  //     $('#widget-templates-list').append(newWidgetElt);
  //     addDeleteUserWidgetButton(id, newWidgetElt);
  //     dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
  //     recursivelyLoadWidgetIntoList(widget, clicheId, newWidgetElt);
  // };

  // that.select = function(id){
  //     $('.selected').removeClass("selected");
  //     $("[data-componentid='" + id + "']").addClass('selected');
  // };

  // that.refresh = function(){
  //     $('.widget-list').html("");
  //     that.loadClicheIntoWidgetList(userApp, selectedUserWidget.meta.id);
  // };

  // that.updateDraggables = function(selectedWidget){
  //     // first enable all draggables
  //     $('.widget').each(function(idx, elt){
  //         elt = $(elt);
  //         if (elt.data('uiDraggable')){
  //             elt.draggable('enable');
  //         }
  //     });
  //     // then disable the relevant ones
  //     userApp.getAllOuterWidgetIds().forEach(function(widgetId){
  //         var widget = userApp.getWidget(widgetId);
  //         var path = widget.getPath(selectedWidget.meta.id);
  //         path.forEach(function(pathWidgetId){ // note this includes the selectedWidgetId
  //             var dragHandle = $('.components').find('[data-componentid='+pathWidgetId+']');
  //             if (dragHandle.data('uiDraggable')){
  //                 dragHandle.draggable('disable');
  //             }
  //         });
  //     });
  // };

}
