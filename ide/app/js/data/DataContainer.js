/**
 * Created by Shinjini on 11/3/2016.
 */

var DataContainer = function(){
    var that = Object.create(DataContainer.prototype);

    var DATA_CONT_REF = 'datatype-container';


    that.getContainerRef = function(){
        return DATA_CONT_REF;
    };

    var makeContainerResizable = function(clicheId, objectId, container, isOverall){

        var dragHandle_se = $('<span></span>');
        dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
        dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
        dragHandle_se.attr('id', 'drag-handle-se' + '_' + objectId);

        var dragHandle_sw = $('<span></span>');
        dragHandle_sw.html('<img src="images/drag_handle_sw_icon.png" width="15px" height="15px">');
        dragHandle_sw.addClass('ui-resizable-handle ui-resizable-sw drag-handle');
        dragHandle_sw.attr('id', 'drag-handle-sw' + '_' + objectId);

        var dragHandle_ne = $('<span></span>');
        dragHandle_ne.html('<img src="images/drag_handle_ne_icon.png" width="15px" height="15px">');
        dragHandle_ne.addClass('ui-resizable-handle ui-resizable-ne drag-handle');
        dragHandle_ne.attr('id', 'drag-handle-se' + '_' + objectId);

        var dragHandle_nw = $('<span></span>');
        dragHandle_nw.html('<img src="images/drag_handle_nw_icon.png" width="15px" height="15px">');
        dragHandle_nw.addClass('ui-resizable-handle ui-resizable-nw drag-handle');
        dragHandle_nw.attr('id', 'drag-handle-nw' + '_' + objectId);

        container.append(dragHandle_se);
        container.append(dragHandle_sw);
        container.append(dragHandle_ne);
        container.append(dragHandle_nw);

        $(container).resizable({
            handles: {
                'se': dragHandle_se,
                'sw': dragHandle_sw,
                'ne': dragHandle_ne,
                'nw': dragHandle_nw
            },
            snap: '.grid-cell',
            snapTolerance: 10,
            start: function(){
                $('.grid').css({
                    visibility: 'visible'
                });
            },
            resize: function(e, ui){
                var newDimensions = {height: ui.size.height/currentZoom, width: ui.size.width/currentZoom};

                // widget.properties.dimensions = newDimensions;
                if (isOverall){
                    selectedProject.bondDisplays[clicheId].dataBondDisplays[objectId].displayProperties.dimensions = newDimensions;
                } else {
                    selectedProject.cliches[clicheId].dataBondDisplays[objectId].displayProperties.dimensions = newDimensions;
                }

            },
            stop: function(e, ui){
                var newPosition = {left:  ui.position.left/currentZoom, top: ui.position.top/currentZoom};

                if (isOverall){
                    selectedProject.bondDisplays[clicheId].dataBondDisplays[objectId].displayProperties.position = newPosition;

                } else {
                    selectedProject.cliches[clicheId].dataBondDisplays[objectId].displayProperties.position = newPosition;
                }
                // not super important to update as you resize so just do it at the end
                //dataMiniNav.updateMiniNavInnerWidgetSizes(outerWidget, currentZoom);

                // TODO dry
                var cliche = selectedProject.cliches[clicheId];
                if (isOverall){
                    canvas.drawClicheDataLines(selectedProject.getAllCliches());
                } else {
                    canvas.drawClicheDataLines([cliche]);
                }

            }
        });
    };

    var toggleOpenClose = function(e, parent){
        var shouldBeOpen = (!parent.hasClass('open'));
        $(parent).parent().find('*').removeClass('open'); // close all siblings
        if (shouldBeOpen){
            parent.addClass('open');
        }
        e.stopPropagation();
    };


    var createEditOptions = function(datatypeId, container){
        var optionsDropdown = $('<div class="dropdown inner-component-options-small">'+
            '<button class="btn btn-default dropdown-toggle btn-xs inner-component-options-dropdown" type="button"  data-toggle="dropdown">'+
            '<span class="glyphicon glyphicon-option-vertical"></span></button>'+
            '<ul class="dropdown-menu">'+

            '</ul>'+
            '</div>');

        var buttonEdit = $('<li>' +
            '<a href="#" class="edit-btn">' +
            '<span class="glyphicon glyphicon-pencil"></span>' +
            '</a>' +
            '</li>');

        buttonEdit.attr('id', 'edit-btn' + '_' + datatypeId);

        var buttonTrash = $('<li>' +
            '<a href="#" class="inner-component-trash">' +
            '<span class="glyphicon glyphicon-trash"></span>' +
            '</a>' +
            '</li>');

        buttonTrash.attr('id', 'inner-component-trash' + '_' + datatypeId);

        optionsDropdown.find('.dropdown-menu')
            .append(buttonEdit)
            .append('<li class="divider"></li>')
            .append(buttonTrash);

        // behaviour

        optionsDropdown.find('.inner-component-options-dropdown, .inner-component-style,' +
            ' .inner-component-custom-style, .inner-component-premade-style').each(function(idx, elt){
            $(elt).click(function(e){
                var thisElt = elt;
                toggleOpenClose(e, $(thisElt).parent());
            });
        });


        buttonEdit.on("click", function (e) {
            e.stopPropagation();
            container.find('.tooltip').addClass('open');
        });


        buttonTrash.click(function(){
            deleteDatatypeFromUserDatatypeAndFromView(datatypeId)
        });


        return optionsDropdown;
    };


    that.createBasicDatatypeContainer = function(clicheId, datatypeId, datatypeDisplayProps, zoom){
        var container = $('<div></div>');
        var containerId = DATA_CONT_REF+'_'+datatypeId;
        container.addClass('dropped '+DATA_CONT_REF).attr('id', containerId);
        container.height(datatypeDisplayProps.displayProperties.dimensions.height * zoom)
            .width(datatypeDisplayProps.displayProperties.dimensions.width * zoom);
        container.data('componentId', datatypeId);
        return container;
    };

    that.createResizableDatatypeContainer = function(clicheId, objectId, datatypeDisplayProps, zoom, isOverall) {
        var container = that.createBasicDatatypeContainer(clicheId, objectId, datatypeDisplayProps, zoom);
        makeContainerResizable(clicheId, objectId, container, isOverall);
        container.append(createEditOptions(objectId, container));
        return container;
    };

    that.setUpContainer = function(container, dragHandle){
        container.append(dragHandle);
    };


    Object.freeze(that);
    return that;
};
