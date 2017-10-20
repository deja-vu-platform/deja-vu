import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Widget } from '../../../models/widget/widget';
import { Dimensions, Position } from '../../common/utility/utility';

@Component({
  selector: 'dv-worksurface',
  templateUrl: './worksurface.component.html',
  styleUrls: ['./worksurface.component.css']
})
export class WorkSurfaceComponent {
  @Input() currentZoom: number;
  @Input() allWidgets:  Map<string, Map<string, Widget>>;
  @Input() set widget(val: Widget) {
    // set up things
    this._widget = val;
  }

  @Input() dimensions: Dimensions;

  @Output() onChange = new EventEmitter<boolean>();

  _widget: Widget;

  handleChange() {
    this.onChange.emit(true);
  }

  // private (innerWidget, outerWidget,
  //   isThisEditable, isThisDraggable, dragHandle, outerWidgetContainer,
  //   overallStyles, zoom, associated, hackityHack) {
  //   const container = this.makeRecursiveWidgetContainers(
  //     innerWidget, outerWidget, isThisEditable, isThisDraggable, dragHandle,
  //     zoom, associated, outerWidget, hackityHack);
  //   if (outerWidgetContainer) {
  //     outerWidgetContainer.append(container);
  //   }
  //   view.displayWidget(true, innerWidget, container, overallStyles, zoom);
  //   if (outerWidgetContainer) { // because order matters :(
  //     registerTooltipBtnHandlers();
  //   }
  //   return container;
  // }

  // // isEditable == component is the selected user component and all its contents are editable
  // private makeRecursiveWidgetContainers(innerWidget, outerWidget,
  //   isThisEditable, isThisDraggable, dragHandle, zoom, associated,
  //   outermostWidget, hackityHack) { //  FIXME!
  //   const type = innerWidget.type;
  //   const widgetId = innerWidget.meta.id;
  //   const editable = isThisEditable && !innerWidget.meta.templateCorrespondingId;

  //   // first create a container for this component
  //   let widgetContainer;
  //   if (!hackityHack) {
  //     if (!dragHandle) {
  //       dragHandle = $('#basic-components .draggable[data-type=' + type + ']').clone();
  //       if (type === 'user') {
  //         dragHandle.text(innerWidget.meta.name);
  //         dragHandle.css('display', 'block');
  //       }
  //       dragHandle.addClass('associated').data('componentid', widgetId)
  //         .data('clicheid', userApp.meta.id); // TODO is this always userApp?
  //     }

  //     if (editable) {
  //       widgetContainer = widgetContainerMaker.createEditableWidgetContainer(innerWidget, outerWidget, zoom, outermostWidget);
  //       dragAndDrop.registerWidgetDragHandleDraggable(dragHandle);
  //     } else {
  //       widgetContainer = widgetContainerMaker
  //         .createMinimallyEditableWidgetContainer
  //         (innerWidget, outerWidget, zoom, outermostWidget, !isThisDraggable);
  //       if (isThisDraggable) {
  //         dragAndDrop.registerWidgetDragHandleDraggable(dragHandle);
  //       } else {
  //         dragHandle.addClass('not-draggable');
  //         dragHandle.notDraggable = true;
  //       }
  //     }

  //     widgetContainerMaker.setUpContainer(widgetContainer, dragHandle, innerWidget, associated, outermostWidget);

  //     let editPopup = false;
  //     if (dragHandle) {
  //       if (dragHandle.newWidget) {
  //         if (!dragHandle.hasClass('dragging-component')) {
  //           editPopup = true;
  //         }
  //       }
  //     }
  //     triggerEdit(widgetContainer, editPopup);


  //   } else {
  //     widgetContainer = widgetContainerMaker.createBasicWidgetContainer(innerWidget, zoom);
  //   }

  //   if (outerWidget.properties.layout[widgetId]) { // means it's not not added yet
  //     widgetContainer.css({
  //       position: 'absolute',
  //       left: outerWidget.properties.layout[widgetId].left * zoom,
  //       top: outerWidget.properties.layout[widgetId].top * zoom,

  //     });
  //   }

  //   if (type === 'user') { // do the recursion
  //     innerWidget.properties.layout.stackOrder.forEach(function (innerInnerWidgetId) {
  //       const innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];
  //       const childEditable = editable && !innerInnerWidget.meta.templateCorrespondingId;
  //       const childDraggable = editable;
  //       const innerInnerWidgetContainer =
  //         this.makeRecursiveWidgetContainers(
  //           innerInnerWidget, innerWidget, childEditable,
  //           childDraggable, null, zoom,
  //           associated, outermostWidget, hackityHack);
  //       widgetContainer.append(innerInnerWidgetContainer);
  //     });
  //   }
  //   return widgetContainer;
  // }

  // /**
  //  * Loads elements into the DOM. If the elements were already there, gets rid of them
  //  * and creates them afresh.
  //  * @param userWidget
  //  * @param zoom
  //  */
  // private loadUserWidgetIntoWorkSurface(userWidget, zoom) {
  //   const overallEditable = userWidget.meta.templateCorrespondingId ? false : true;
  //   const workSurface = this.createOrResetWorkSurface(userWidget, zoom, overallEditable);

  //   widgetEditsManager.refreshPropertyValues(userWidget);
  //   userWidget.properties.styles = widgetEditsManager.getMostRelevantOverallCustomChanges(userWidget, userWidget);

  //   userWidget.properties.layout.stackOrder.forEach(function (innerWidgetId) {
  //     const innerWidget = userWidget.innerWidgets[innerWidgetId];
  //     const isEditable = overallEditable && innerWidget.meta.templateCorrespondingId ? false : true;
  //     const isDraggable = overallEditable && true;
  //     const overallStyles = widgetEditsManager.getMostRelevantOverallCustomChanges(userWidget, innerWidgetId);
  //     this.makeRecursiveWidgetContainersAndDisplay(innerWidget,
  //       userWidget, isEditable, isDraggable, null, workSurface, overallStyles, zoom, true);
  //   });
  //   miniNav.setUpMiniNavElementAndInnerWidgetSizes(userWidget);
  // }

  // private makeWorkSurfaceResizable(workSurface, userWidget) {
  //   const widgetId = userWidget.meta.id;

  //   const dragHandle_se = $('<span></span>');
  //   dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
  //   dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
  //   dragHandle_se.attr('id', 'drag-handle-se' + '_' + widgetId);

  //   workSurface.append(dragHandle_se);


  //   $(workSurface).resizable({
  //     handles: {
  //       'se': dragHandle_se,
  //     },
  //     minHeight: 0,
  //     minWidth: 0,
  //     resize: function (e, ui) {
  //       // TODO need to DRY this up and/or combine with the widget container methods
  //       const newDimensions = { height: ui.size.height / currentZoom, width: ui.size.width / currentZoom };
  //       widgetEditsManager.updateCustomProperties(userWidget, userWidget.meta.id, 'dimensions', newDimensions);

  //     },
  //     stop: function (e, ui) {
  //       // not super important to update as you resize so just do it at the end
  //       miniNav.updateMiniNavInnerWidgetSizes(userWidget, currentZoom);
  //       grid.setUpGrid();
  //     }
  //   });
  // }

  // private makeWorkSurfaceDroppableToWidgets(workSurface, outermostWidget) {
  //   function onDropFinished(dragHandle, widget) {
  //     const widgetId = widget.meta.id;

  //     if (dragHandle.associated) {
  //       const parent = outermostWidget.getInnerWidget(widgetId, true);
  //       if (parent.meta.id === outermostWidget.meta.id) { // fixme SUPERHACK :'(
  //         shiftOrder(widgetId, outermostWidget);
  //       }
  //     }
  //     const firstInnerWidgetId = outermostWidget.getPath(widgetId)[1]; // this should always exist
  //     if (!firstInnerWidgetId) {
  //       console.log('something went wrong in onDropFinished');
  //     }

  //     const firstInnerWidget = outermostWidget.getInnerWidget(firstInnerWidgetId);

  //     const overallStyles = widgetEditsManager
  //       .getMostRelevantOverallCustomChanges(
  //       outermostWidget, widgetId);

  //     this.loadUserWidgetIntoWorkSurface(outermostWidget, currentZoom);
  //     grid.setUpGrid();
  //   }

  //   const dropSettings = dragAndDrop
  //     .widgetToWorkSurfaceDropSettings(outermostWidget, onDropFinished);

  //   workSurface.droppable(dropSettings);
  // }

  // // puts componentId at the top!
  // private shiftOrder(widgetId, outermostWidget) {
  //   // TODO make this work for inner widgets
  //   const parent = outermostWidget.getInnerWidget(widgetId, true);

  //   const stackOrder = parent.properties.layout.stackOrder;

  //   let index;
  //   for (let i = 0; i < stackOrder.length; i++) {
  //     const id = stackOrder[i];
  //     if (widgetId === id) {
  //       index = i;
  //       break;
  //     }
  //   }

  //   parent.properties.layout.stackOrder.splice(index, 1);
  //   parent.properties.layout.stackOrder.push(widgetId);
  //   widgetEditsManager.updateCustomProperties(outermostWidget, widgetId, 'stackOrder', stackOrder, true);
  // }

  // private findWidgetsToShift(movingId, otherId) {// TODO better naming?
  //   const container = $('#' + containerRef + '_' + otherId);

  //   const top = container.offset().top;
  //   const left = container.offset().left;
  //   const right = left + container.width();
  //   const bottom = top + container.height();
  //   const widgetsToShift = {};
  //   [left, right].forEach(function (x) {
  //     [top, bottom].forEach(function (y) {
  //       const allElements = utils.allElementsFromPoint(x, y);
  //       const overlappingWidgets = [];
  //       $(allElements).filter('.' + containerRef).each(function (idx, elt) {
  //         const containerId = $(elt).attr('id');
  //         if (containerId !== 'dragging-container') {
  //           const id = widgetContainerMaker.getWidgetIdFromContainerId($(elt).attr('id'));
  //           if (movingId === otherId) { // if we are looking at the moving container
  //             if (!(id === movingId)) {
  //               overlappingWidgets.push(id); // push in every other overlapping container
  //             }
  //           } else {
  //             if (id === movingId) { // if we overlap with the moving container
  //               overlappingWidgets.push(otherId); // push it in
  //             }
  //           }
  //         }
  //       });
  //       overlappingWidgets.forEach(function (id) {
  //         if (!(id in widgetsToShift)) {
  //           widgetsToShift[id] = '';
  //         }
  //       });
  //     });
  //   });
  //   return Object.keys(widgetsToShift);
  // }

  // changeOrderByOne(widgetId, userWidget, isUp) {
  //   const widgetsToShift = {};
  //   for (const id of Object.keys(userWidget.innerWidgets)) {
  //     const overlappingWidgets = this.findWidgetsToShift(widgetId, id);
  //     overlappingWidgets.forEach(function (oid) {
  //       if (!(oid in widgetsToShift)) {
  //         widgetsToShift[oid] = '';
  //       }
  //     });
  //   }

  //   const stackOrder = userWidget.properties.layout.stackOrder;
  //   let idxThisWidget;
  //   let idxNextWidget;
  //   if (!isUp) {
  //     stackOrder.reverse();
  //   }
  //   for (let i = 0; i < stackOrder.length; i++) {
  //     const id = stackOrder[i];
  //     if (id === widgetId) {
  //       idxThisWidget = i;
  //     }
  //     if (typeof idxThisWidget !== 'undefined') { // 0 is considered false!
  //       // we have passed this component!
  //       if (id in widgetsToShift) {
  //         idxNextWidget = i;
  //         break;
  //       }
  //     }
  //   }
  //   if (typeof idxNextWidget !== 'undefined') { // there is something to move
  //     let idxToSwap = idxThisWidget;
  //     // from the component after this to the next
  //     for (const i = idxThisWidget + 1; i < idxNextWidget + 1; i++) {
  //       const id = stackOrder[i];
  //       stackOrder[idxToSwap] = id;
  //       idxToSwap = i;
  //     }
  //     stackOrder[idxNextWidget] = widgetId;
  //   }
  //   if (!isUp) {
  //     stackOrder.reverse();
  //   }
  //   userWidget.properties.layout.stackOrder = stackOrder;
  //   // FIXME faster implem?
  //   this.loadUserWidgetIntoWorkSurface(userWidget, currentZoom);
  // }



  // /**
  //  * enables it if its elements have already been created,
  //  * otherwise loads the elements into the DOM
  //  * @param userWidget
  //  * @param zoom
  //  */
  // loadUserWidget(userWidget) {
  //   const widgetId = userWidget.meta.id;
  //   const workSurface = $('#' + WIDGET_WS_REF + '_' + widgetId);
  //   zoomElement.registerZoom(userWidget);

  //   if (workSurface.length === 0) {
  //     currentZoom = 1;
  //     this.loadUserWidgetIntoWorkSurface(userWidget, currentZoom);
  //   } else {
  //     this.disableAllWidgetDomElementsExcept(widgetId);
  //     this.setWidgetOptions(userWidget);
  //     zoomElement.updateZoomFromState(userWidget);
  //     // TODO other way? for now, reload the thinger
  //     this.loadUserWidgetIntoWorkSurface(userWidget, currentZoom);
  //   }
  //   miniNav.setUpMiniNavElementAndInnerWidgetSizes(userWidget);
  //   grid.setUpGrid();
  // }



  // /**
  //  * creates an empty worksurface and appends it to the outer container
  //  * @param userWidget
  //  * @param zoom
  //  */
  // private setUpEmptyWorkSurface(userWidget, zoom, editable) {
  //   currentZoom = zoom; // set zoom value 100%
  //   const widgetId = userWidget.meta.id;
  //   this.disableAllWidgetDomElementsExcept(widgetId);
  //   const workSurface = this.createWorkSurface(
  //     widgetId, userWidget.properties.dimensions.height,
  //     userWidget.properties.dimensions.width);

  //   $('#outer-container').append(workSurface);

  //   this.resetWorkSurface(workSurface);

  //   if (editable) {
  //      // TODO experimentation
  //      this.makeWorkSurfaceResizable(workSurface, userWidget);
  //   }
  //   this.makeWorkSurfaceDroppableToWidgets(workSurface, userWidget);
  //   zoomElement.updateZoomFromState(userWidget);

  //   setWidgetOptions(userWidget);

  //   return workSurface;
  // }



  // /**
  //  * Disabled by changing the id and class names
  //  * @param widgetId
  //  */
  // private disableWidgetDOMElements(widgetId) {
  //   const workSurface = $('#' + WIDGET_WS_REF + '_' + widgetId);
  //   if (workSurface.hasClass('hidden-component')) {
  //     return;
  //   }

  //   $(workSurface).addClass('hidden-component');

  //   $(workSurface).find('*').each(function () {
  //     const elt = this;
  //     const id = elt.id;
  //     if (id.length > 0) {
  //       elt.id = 'disabled_' + widgetId + '_' + elt.id;
  //     }
  //     let classes = elt.className;
  //     if (classes.length > 0) {
  //       classes = classes.split(' ');
  //       let classNames = '';
  //       classes.forEach(function (className) {
  //         classNames = classNames + ' ' +
  //         'disabled_' + widgetId + '_' + className;
  //       });
  //       elt.className = classNames;
  //     }
  //   });
  // }


  // private enableWidgetDOMElements(widgetId) {
  //   const workSurface = $('#' + WIDGET_WS_REF + '_' + widgetId);
  //   if (!workSurface.hasClass('hidden-component')) {
  //     return;
  //   }
  //   $(workSurface).removeClass('hidden-component');

  //   $(workSurface).find('*').each(function () {
  //     const elt = this;

  //     const id = elt.id;
  //     if (id.length > 0) {
  //       elt.id = id.replace('disabled_' + widgetId + '_', '');
  //     }
  //     let classes = elt.className;
  //     if (classes.length > 0) {
  //       classes = classes.split(' ');
  //       let classNames = '';
  //       classes.forEach(function (className) {
  //         classNames = classNames + ' ' +
  //             className.replace('disabled_' + widgetId + '_', '');
  //       });
  //       elt.className = classNames.trim();
  //     }
  //   });
  // }

  // private disableAllWidgetDomElementsExcept(widgetToEnableId) {
  //   userApp.getAllWidgetIds(true).forEach(function (widgetId) {
  //     if (widgetToEnableId === widgetId) {
  //       this.enableWidgetDOMElements(widgetId);
  //       return;
  //     }
  //     this.disableWidgetDOMElements(widgetId);
  //   });
  // }
}
