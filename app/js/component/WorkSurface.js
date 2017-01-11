/**
 * Created by Shinjini on 9/26/2016.
 */

var componentContainerMaker = ComponentContainer();

var WorkSurface = function(){
    var that = Object.create(WorkSurface);


    var createWorkSurface = function(componentId, height, width){
        var workSurface = $('<div></div>');
        workSurface.addClass('work-surface');
        workSurface.attr('id', 'work-surface_'+componentId);

        workSurface.height(height).width(width);
        return workSurface;
    };

    var createOrResetWorkSurface = function(component, zoom){
        var componentId = component.meta.id;
        var workSurface = $('#work-surface'+'_'+componentId);
        if (workSurface.length===0){
            workSurface = that.setUpEmptyWorkSurface(component, zoom);
        } else {
            resetWorkSurface(workSurface);
        }

        return workSurface
    };

    var resetWorkSurface = function(workSurface){
        var state = {
            zoom: 1,
        };
        workSurface.data('state', state);
        workSurface.html('');
    };

    that.makeRecursiveComponentContainersAndDisplay = function(component, outerComponent, isThisEditable, dragHandle, outerComponentContainer, overallStyles, zoom){
        var container = makeRecursiveComponentContainers(component, outerComponent, isThisEditable, dragHandle, zoom);
        if (outerComponentContainer){
            outerComponentContainer.append(container);
            registerTooltipBtnHandlers();
        }
        view.displayComponent(true, component, container, overallStyles, zoom);
        return container;
    };

    // isEditable == component is the selected user component and all its contents are editable
    var makeRecursiveComponentContainers = function(component, outerComponent, isThisEditable, dragHandle, zoom){
        var type = component.type;
        var componentId = component.meta.id;

        // first create a container for this component
        var componentContainer;
        if (isThisEditable){
            componentContainer = componentContainerMaker.createEditableComponentContainer(component, outerComponent, zoom);
            if (!dragHandle){
                dragHandle = $('#basic-components .draggable[data-type=' + type + ']').clone();
                if (type == 'user'){
                    dragHandle.text(component.meta.name);
                    dragHandle.css('display', 'block');
                }
                dragHandle.addClass('associated').data('componentid', componentId);
            }
            componentContainerMaker.setUpContainer(componentContainer, dragHandle, component);
            registerDraggable(dragHandle);
            var editPopup = false;
            if (dragHandle){
                if (!dragHandle.hasClass('associated')){
                    if (!dragHandle.hasClass('dragging-component')){
                        editPopup = true;
                    }
                }
            }
            triggerEdit(componentContainer, editPopup);
        } else {
            componentContainer = componentContainerMaker.createBasicComponentContainer(component, zoom);
        }

        if (outerComponent.layout[componentId]){ // means it's not not added yet
            componentContainer.css({
                position: 'absolute',
                left: outerComponent.layout[componentId].left*zoom,
                top: outerComponent.layout[componentId].top*zoom,

            });
        }

        if (type === 'user'){ // do the recursion
            component.layout.stackOrder.forEach(function(innerComponentId){
                var innerComponent = component.components[innerComponentId];
                var innerComponentContainer = makeRecursiveComponentContainers(innerComponent, component, false, null, zoom);
                componentContainer.append(innerComponentContainer);
            });
        }
        return componentContainer;
    };

    /**
     * Loads elements into the DOM. If the elements were already there, gets rid of them
     * and creates them afresh.
     * @param component
     * @param zoom
     */
    var loadComponentIntoWorkSurface = function(component, zoom){
        var workSurface = createOrResetWorkSurface(component, zoom);

        component.layout.stackOrder.forEach(function(innerComponentId){
            var innerComponent = component.components[innerComponentId];
                 if (innerComponent.type == 'user'){ // TODO FIXME doing some sketchy shit here
                     var customStyles = innerComponent.properties.custom;
                     var parentId = innerComponent.meta.parentId;
                     innerComponent = createUserComponentCopy(UserComponent.fromString(JSON.stringify(selectedProject.components[parentId])));
                     innerComponent.meta.id = innerComponentId;
                     innerComponent.meta.parentId = parentId;
                     innerComponent.properties.custom = customStyles;
                     component.components[innerComponentId] = innerComponent;
                 }

            var overallStyles = component.properties.custom;
            that.makeRecursiveComponentContainersAndDisplay(innerComponent, component, true, null, workSurface, overallStyles, zoom);
        });
    };

    var makeWorkSurfaceResizable = function(workSurface, component){
        var componentId = component.meta.id;

        var dragHandle_se = $('<span></span>');
        dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
        dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
        dragHandle_se.attr('id', 'drag-handle-se' + '_' + componentId);

        workSurface.append(dragHandle_se);


        $(workSurface).resizable({
            handles: {
                'se': dragHandle_se,
            },
            minHeight: 0,
            minWidth: 0,
            start: function(){
                // var minWidth = $('.grid-cell:last').position().left;
                // var minHeight = $('.grid-cell:last').position().top;

                var minWidth = grid.getRightMostGridPosition();
                var minHeight = grid.getBottomMostGridPosition();


                $(this).resizable('option', 'minWidth', minWidth);
                $(this).resizable('option', 'minHeight', minHeight);
            },
            resize: function(e, ui){
                component.dimensions.height = ui.size.height/currentZoom;
                component.dimensions.width = ui.size.width/currentZoom;
            },
            stop: function(e, ui){
                // not super important to update as you resize so just do it at the end
                miniNav.updateMiniNavInnerComponentSizes(component, currentZoom);
                grid.setUpGrid();

            }
        });

    };

    var makeWorkSurfaceDroppableToComponents = function(workSurface, outerComponent){
        var onDropFinished = function(dragHandle, component){
            if (dragHandle.associated){
                shiftOrder(component.meta.id, outerComponent);
            }
            that.makeRecursiveComponentContainersAndDisplay(component, outerComponent, true, dragHandle, workSurface, outerComponent.properties.custom, currentZoom);
            miniNav.updateMiniNavInnerComponentSizes(outerComponent, currentZoom);
            grid.setUpGrid();
        };

        var dropSettings = dragAndDrop.widgetToWorksurfaceDropSettings(outerComponent, onDropFinished);

        workSurface.droppable(dropSettings);
    };

    // puts componentId at the top!
    var shiftOrder = function(componentId, outerComponent){
        var stackOrder = outerComponent.layout.stackOrder;

        var index;
        for (var i = 0; i < stackOrder.length; i++){
            var id = stackOrder[i];
            if (componentId == id){
                index = i;
                break
            }
        }
        outerComponent.layout.stackOrder.splice(index, 1);
        outerComponent.layout.stackOrder.push(componentId);
    };


    // from http://stackoverflow.com/questions/8813051/determine-which-element-the-mouse-pointer-is-on-top-of-in-javascript
    var allElementsFromPoint = function(x, y) {
        var element, elements = [];
        var oldVisibility = [];
        while (true) {
            element = document.elementFromPoint(x, y);
            if (!element || element === document.documentElement) {
                break;
            }
            elements.push(element);
            oldVisibility.push(element.style.visibility);
            element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
        }
        for (var k = 0; k < elements.length; k++) {
            elements[k].style.visibility = oldVisibility[k];
        }
        elements.reverse();
        return elements;
    };

    var findComponentsToShift = function(movingId, otherId){// TODO better naming?
        var container = $('#component-container_'+otherId);

        var top = container.offset().top;
        var left = container.offset().left;
        var right = left + container.width();
        var bottom = top + container.height();
        var componentsToShift = {};
        [left, right].forEach(function(x) {
            [top, bottom].forEach(function (y) {
                var allElements = allElementsFromPoint(x, y);
                var overlappingComponents = [];
                $(allElements).filter('.component-container').each(function (idx, elt) {
                    var containerId = $(elt).attr('id');
                    if (containerId != 'dragging-container') {
                        var id = getComponentIdFromContainerId($(elt).attr('id'));
                        if (movingId == otherId){ // if we are looking at the moving container
                            if (!(id == movingId)) {
                                overlappingComponents.push(id); // push in every other overlapping container
                            }
                        } else {
                            if (id == movingId){ // if we overlap with the moving container
                                overlappingComponents.push(otherId); // push it in
                            }
                        }
                    }
                });
                overlappingComponents.forEach(function (id) {
                    if (!(id in componentsToShift)) {
                        componentsToShift[id] = "";
                    }
                })
            });
        });
        return Object.keys(componentsToShift);
    };

    that.changeOrderByOne = function(componentId, outerComponent, isUp){
        var componentsToShift = {};
        for (var id in outerComponent.components){
            var overlappingComponents = findComponentsToShift(componentId, id);
            overlappingComponents.forEach(function(id){
                if (!(id in componentsToShift)){
                    componentsToShift[id] = "";
                }
            })
        }

        var stackOrder = outerComponent.layout.stackOrder;
        var idxThisComponent;
        var idxNextComponent;
        if (!isUp){
            stackOrder.reverse();
        }
        for (var i = 0; i<stackOrder.length; i++){
            var id = stackOrder[i];
            if (id == componentId){
                idxThisComponent = i;
            }
            if (typeof idxThisComponent !== 'undefined'){ // 0 is considered false!
                // we have passed this component!
                if (id in componentsToShift){
                    idxNextComponent = i;
                    break;
                }
            }
        }
        if (typeof idxNextComponent !== 'undefined') { // there is something to move
            var idxToSwap = idxThisComponent;
            // from the component after this to the next
            for (var i = idxThisComponent + 1; i < idxNextComponent + 1; i++) {
                var id = stackOrder[i];
                stackOrder[idxToSwap] = id;
                idxToSwap = i;
            }
            stackOrder[idxNextComponent] = componentId;
        }
        if (!isUp){
            stackOrder.reverse();
        }
        outerComponent.layout.stackOrder = stackOrder;
        // FIXME faster implem?
        loadComponentIntoWorkSurface(outerComponent, currentZoom);
    };



    /**
     * enables it if its elements have already been created,
     * otherwise loads the elements into the DOM
     * @param component
     * @param zoom
     */
    that.loadUserComponent = function(component){
        var componentId = component.meta.id;
        var workSurface = $('#work-surface'+'_'+componentId);
        zoomElement.registerZoom(selectedUserComponent);

        if (workSurface.length===0){
            currentZoom = 1;
            loadComponentIntoWorkSurface(component, currentZoom);
        } else {
            disableAllComponentDomElementsExcept(componentId);
            setComponentOptions(component);
            zoomElement.updateZoomFromState(component);
        }
        miniNav.setUpMiniNavElementAndInnerComponentSizes(component);
        grid.setUpGrid();
    };



    /**
     * creates an empty worksurface and appends it to the outer container
     * @param component
     * @param zoom
     */
    that.setUpEmptyWorkSurface = function(component, zoom){
        currentZoom = zoom; // set zoom value 100%
        var componentId = component.meta.id;
        disableAllComponentDomElementsExcept(componentId);
        var workSurface = createWorkSurface(componentId, component.dimensions.height, component.dimensions.width);
        resetWorkSurface(workSurface);

        $('#outer-container').append(workSurface);

        makeWorkSurfaceResizable(workSurface, component); // TODO experimentation
        makeWorkSurfaceDroppableToComponents(workSurface, component);
        setComponentOptions(selectedProject.components[componentId]);
        zoomElement.updateZoomFromState(component);

        return workSurface
    };


    Object.freeze(that);
    return that
};
