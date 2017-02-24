/**
 * Created by Shinjini on 9/26/2016.
 */

var dataContainerMaker = DataContainer();

var DataWorkSurface = function(){
    var that = Object.create(DataWorkSurface.prototype);

    var DATA_WS_ID = 'data-work-surface';

    var createWorkSurface = function(outerWidgetId, height, width){
        var workSurface = $('<div></div>');
        workSurface.addClass(DATA_WS_ID);
        workSurface.attr('id', DATA_WS_ID+'_'+outerWidgetId);

        workSurface.height(height).width(width);
        return workSurface;
    };

    var createOrResetWorkSurface = function(outerWidget, zoom){
        var widgetId = outerWidget.meta.id;
        var workSurface = $('#'+DATA_WS_ID+'_'+widgetId);
        if (workSurface.length===0){
            workSurface = that.setUpEmptyWorkSurface(outerWidget, zoom);
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
        workSurface.find('.component-container').remove();
    };

    /**
     * Loads elements into the DOM. If the elements were already there, gets rid of them
     * and creates them afresh.
     * @param userWidget
     * @param zoom
     */
    var loadDatatypeIntoWorkSurface = function(userWidget, zoom){
        var workSurface = createOrResetWorkSurface(userWidget, zoom);

        var diff = userWidget.properties.layout.stackOrder.length - Object.keys(userWidget.innerWidgets).length;
        if (diff != 0){
            console.log('in load user widget into worksurface');
            console.log(userWidget.properties.layout.stackOrder);
            console.log(Object.keys(userWidget.innerWidgets));
            console.log(userWidget);
        }

        userWidget = dataEditsManager.refreshFromProject(userWidget);

        userWidget.properties.layout.stackOrder.forEach(function(innerWidgetId){
            var innerWidget = userWidget.innerWidgets[innerWidgetId];
            var overallStyles = userWidget.properties.styles.custom;
            that.makeRecursiveWidgetContainersAndDisplay(innerWidget, userWidget, true, null, workSurface, overallStyles, zoom, true);
        });
    };


    var makeWorkSurfaceDroppableToWidgets = function(workSurface, outermostWidget){
        var onDropFinished = function(dragHandle, widget){

            var widgetId = widget.meta.id;

            if (dragHandle.associated){
                var parent = dataEditsManager.getInnerWidget(outermostWidget, widgetId, true);
            }
            var firstInnerWidgetId = dataEditsManager.getPath(outermostWidget, widgetId)[1]; // this should always exist
            if (!firstInnerWidgetId){
                console.log('something went wrong in onDropFinished');
            }

            var firstInnerWidget = dataEditsManager.getInnerWidget(outermostWidget, firstInnerWidgetId);

             dataContainerMaker.createBasicWidgetContainer(firstInnerWidget, currentZoom);
        };

        var dropSettings = dataDragAndDrop.widgetToWorkSurfaceDropSettings(outermostWidget, onDropFinished);

        workSurface.droppable(dropSettings);
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


    /**
     * enables it if its elements have already been created,
     * otherwise loads the elements into the DOM
     * @param userWidget
     * @param zoom
     */
    that.loadDatatype = function(object){
        if (object.objectType == "UserComponent"){
            // load all the stuff
        } else {
            var datatype = object;


            var datatypeId = datatype.meta.id;
            var workSurface = $('#'+DATA_WS_ID+'_'+datatypeId);
            dataZoomElement.registerZoom(datatype);

            if (workSurface.length===0){
                currentZoom = 1;
                loadDatatypeIntoWorkSurface(datatype, currentZoom);
            } else {
                disableAllWidgetDomElementsExcept(datatypeId);
                setWidgetOptions(datatype);
                dataZoomElement.updateZoomFromState(datatype);
                // TODO other way? for now, reload the thinger
                loadDatatypeIntoWorkSurface(datatype, currentZoom);
            }
        }

        //dataMiniNav.setUpMiniNavElementAndInnerWidgetSizes(datatype);
        //grid.setUpGrid();
    };



    /**
     * creates an empty worksurface and appends it to the outer container
     * @param userWidget
     * @param zoom
     */
    that.setUpEmptyWorkSurface = function(userWidget, zoom){
        currentZoom = zoom; // set zoom value 100%
        var widgetId = userWidget.meta.id;
        disableAllWidgetDomElementsExcept(widgetId);
        var workSurface = createWorkSurface(widgetId, userWidget.properties.dimensions.height, userWidget.properties.dimensions.width);

        $('#outer-container').append(workSurface);

        resetWorkSurface(workSurface);

        makeWorkSurfaceDroppableToWidgets(workSurface, userWidget);
        dataZoomElement.updateZoomFromState(userWidget);

        setWidgetOptions(selectedProject.components[widgetId]);

        return workSurface
    };



    /**
     * Disabled by changing the id and class names
     * @param widgetId
     */
    var disableWidgetDOMElements = function(widgetId){
        var workSurface = $('#'+DATA_WS_ID+'_'+widgetId);
        $(workSurface).addClass('hidden-component');

        $(workSurface).find('*').each(function() {
            var elt = this;
            
            var id = elt.id;
            if (id.length>0){
                elt.id = 'disabled_'+widgetId+'_'+elt.id;
            }
            var classes = elt.className;
            if (classes.length>0){
                classes = classes.split(' ');
                var classNames = '';
                classes.forEach(function(className){
                    classNames = classNames + ' ' + 'disabled_'+widgetId+'_'+className;
                });
                elt.className = classNames;
            }
        });
    };


    var enableWidgetDOMElements = function(widgetId){
        var workSurface = $('#'+DATA_WS_ID+'_'+widgetId);
        $(workSurface).removeClass('hidden-component');

        $(workSurface).find('*').each(function() {
            var elt = this;

            var id = elt.id;
            if (id.length>0){
                elt.id = id.replace('disabled_'+widgetId+'_', '');
            }
            var classes = elt.className;
            if (classes.length>0){
                classes = classes.split(' ');
                var classNames = '';
                classes.forEach(function(className){
                    classNames =  classNames  + ' ' +  className.replace('disabled_'+widgetId+'_', '');
                });
                elt.className = classNames.trim();
            }
        });
    };

    var disableAllWidgetDomElementsExcept = function(widgetToEnableId){
        for (var widgetId in selectedProject.components){
            if (widgetToEnableId == widgetId){
                enableWidgetDOMElements(widgetId);
                continue;
            }
            if ($('#'+DATA_WS_ID+'_'+widgetId).hasClass('hidden-component')){
                continue;
            }
            disableWidgetDOMElements(widgetId);
        }
    };

    Object.freeze(that);
    return that
};
