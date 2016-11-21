/**
 * Created by Shinjini on 9/26/2016.
 */

var componentContainerMaker = ComponentContainerMaker();

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
            var type = innerComponent.type;
            var componentContainer = componentContainerMaker.createComponentContainer(innerComponent, zoom);
            var widget = $('#basic-components .draggable[name=' + type + ']').clone();
            widget.addClass('associated').data('componentId', innerComponentId);

            componentContainer.css({
                position: 'absolute',
                left: component.layout[innerComponentId].left,
                top: component.layout[innerComponentId].top,

            });

            componentContainerMaker.setUpContainer(componentContainer, widget, innerComponent, zoom);
            registerDraggable(widget);
            workSurface.append(componentContainer);
            triggerEdit(componentContainer, false);
            registerTooltipBtnHandlers('component-container_'+innerComponentId);
        });
        that.setUpGrid();

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
                // var numComponents = selectedUserComponent.layout.stackOrder.length;
                // var minWidth = $('#grid-cell_'+(2*numComponents)+'_'+(2*numComponents)).position().left;
                // var minHeight = $('#grid-cell_'+(2*numComponents)+'_'+(2*numComponents)).position().top;
                var minWidth = $('.grid-cell:last').position().left;
                var minHeight = $('.grid-cell:last').position().top;

                $(this).resizable('option', 'minWidth', minWidth);
                $(this).resizable('option', 'minHeight', minHeight);
            },
            resize: function(e, ui){
                component.dimensions.height = ui.size.height/currentZoom;
                component.dimensions.width = ui.size.width/currentZoom;
            },
            stop: function(e, ui){
                // not super important to update as you resize so just do it at the end
                miniNav.updateMiniNavInnerComponentSizes(currentZoom);
                that.setUpGrid();

            }
        });

    }

    var makeWorkSurfaceDroppableToComponents = function(workSurface){

        var dropSettings = {
            accept: ".widget",
            hoverClass: "highlight",
            tolerance: "fit",
            drop: function(event, ui) {
                // alert the draggable that drop was successful:
                $(ui.helper).data('dropped', true);
                var top = ui.position.top;
                var left = ui.position.left;


                var widget = $(ui.draggable);
                // on drop, there should always be a dragging component
                var component = draggingComponent;
                var componentId = component.meta.id;
                var componentContainer = componentContainerMaker.createComponentContainer(component, currentZoom);
                componentContainerMaker.setUpContainer(componentContainer, widget, component, currentZoom);
                registerDraggable();
                if (!widget.hasClass('associated')){
                    $(ui.helper).data('newcomponent', true);
                    selectedUserComponent.addComponent(component);
                    widget.addClass('associated').data('componentId', componentId);
                    triggerEdit(componentContainer, true);
                } else {
                    shiftOrder(componentId);
                    triggerEdit(componentContainer, false);
                }

                workSurface.append(componentContainer);
                registerTooltipBtnHandlers();


                componentContainer.css({
                    position: 'absolute',
                    left: left,
                    top: top
                });
                selectedUserComponent.layout[componentId] = {top: top/currentZoom, left: left/currentZoom};
                miniNav.updateMiniNavInnerComponentSizes(currentZoom);
                that.setUpGrid();
            }
        };

        workSurface.droppable(dropSettings);
    };

    // puts componentId at the top!
    var shiftOrder = function(componentId){
        var stackOrder = selectedUserComponent.layout.stackOrder;

        var index;
        for (var i = 0; i < stackOrder.length; i++){
            var id = stackOrder[i];
            if (componentId == id){
                index = i;
                break
            }
        }
        selectedUserComponent.layout.stackOrder.splice(index, 1);
        selectedUserComponent.layout.stackOrder.push(componentId);
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

    var changeOrderByOne = function(componentId, isUp){
        var componentsToShift = {};
        for (var id in selectedUserComponent.components){
            var overlappingComponents = findComponentsToShift(componentId, id);
            overlappingComponents.forEach(function(id){
                if (!(id in componentsToShift)){
                    componentsToShift[id] = "";
                }
            })
        }

        var stackOrder = selectedUserComponent.layout.stackOrder;
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
        selectedUserComponent.layout.stackOrder = stackOrder;
        console.log(stackOrder);
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
        if (workSurface.length===0){
            currentZoom = 1;
            loadComponentIntoWorkSurface(component, currentZoom);
        } else {
            disableAllComponentDomElementsExcept(componentId);
            setComponentOptions(component);
            zoomElement.updateZoomFromState(componentId);
        }
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
        makeWorkSurfaceDroppableToComponents(workSurface);
        setComponentOptions(selectedProject.components[componentId]);
        zoomElement.updateZoomFromState(componentId);

        return workSurface
    };

    that.setUpGrid = function(){
        $('.grid').remove();
        var workSurface = $('#work-surface_'+selectedUserComponent.meta.id);

        var grid = {x: {}, y:{}};
        for (var componentId in selectedUserComponent.components){
            // existing components should also be in the work surface!
            var container = $('#component-container_'+componentId);
            var top = container.position().top;
            var left = container.position().left;
            var right = left + container.width();
            var bottom = top + container.height();
            grid.x[left] = '';
            grid.x[right] = '';
            grid.y[top] = '';
            grid.y[bottom] = '';
        }
        var xs = Object.keys(grid.x).map(function(key){
            return parseFloat(key);
        });

        // var top = workSurface.offset().top;
        var top = 0;
        var bottom = top + workSurface.height();
        // var left = workSurface.offset().left;
        var left = 0;
        var right = left + workSurface.width();

        xs.push(left);
        xs.push(right);
        xs.sort(function(a, b){
            return a-b;
        });

        var ys = Object.keys(grid.y).map(function(key){
            return parseFloat(key);
        });
        ys.push(top);
        ys.push(bottom);
        ys.sort(function(a, b){
            return a-b;
        });

        var numRows = ys.length-1;
        var numCols = xs.length-1;

        var gridElt = $('<div></div>');
        gridElt.addClass('grid');
        for (var col=0; col<numCols; col++){
            var colElt = $('<div></div>');
            colElt.addClass('grid-col');
            gridElt.append(colElt);

            for (var row=0; row<numRows; row++){
                var cellElt = $('<div></div>');
                cellElt.addClass('grid-cell');
                cellElt.attr('id', 'grid-cell_'+row+'_'+col);
                colElt.append(cellElt);
                cellElt.css({
                    width: xs[col+1] - xs[col],
                    height: ys[row+1] - ys[row],
                });
            }
        }
        gridElt.css({
            position: 'absolute',
            // top: ys[0] - workSurface.offset().top,
            // left: xs[0] - workSurface.offset().left,
            top: 0,
            left: 0,
            width: 1.1*(xs[numCols] - xs[0]),
            visibility: 'hidden',
        });
        workSurface.append(gridElt);
        // $('body').append(gridElt);
        $('.grid-col').css({
            display: 'inline-block'
        });
        $('.grid-cell').css({
            display: 'block',
            border: '1px dashed grey'
        });
    };



    return that
};
