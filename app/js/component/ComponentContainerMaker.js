/**
 * Created by Shinjini on 11/3/2016.
 */

var ComponentContainerMaker = function(){
    var that = Object.create(ComponentContainerMaker);


    var makeContainerResizable = function(container, component){
        var componentId = component.meta.id;

        var dragHandle_se = $('<span></span>');
        dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
        dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
        dragHandle_se.attr('id', 'drag-handle-se' + '_' + componentId);

        var dragHandle_sw = $('<span></span>');
        dragHandle_sw.html('<img src="images/drag_handle_sw_icon.png" width="15px" height="15px">');
        dragHandle_sw.addClass('ui-resizable-handle ui-resizable-sw drag-handle');
        dragHandle_sw.attr('id', 'drag-handle-sw' + '_' + componentId);

        var dragHandle_ne = $('<span></span>');
        dragHandle_ne.html('<img src="images/drag_handle_ne_icon.png" width="15px" height="15px">');
        dragHandle_ne.addClass('ui-resizable-handle ui-resizable-ne drag-handle');
        dragHandle_ne.attr('id', 'drag-handle-se' + '_' + componentId);

        var dragHandle_nw = $('<span></span>');
        dragHandle_nw.html('<img src="images/drag_handle_nw_icon.png" width="15px" height="15px">');
        dragHandle_nw.addClass('ui-resizable-handle ui-resizable-nw drag-handle');
        dragHandle_nw.attr('id', 'drag-handle-nw' + '_' + componentId);

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
                component.dimensions.height = ui.size.height/currentZoom;
                component.dimensions.width = ui.size.width/currentZoom;
                // TODO woah! It resizes as you go!
                refreshContainerDisplay(container.attr('id'), currentZoom);
            },
            stop: function(e, ui){
                // not super important to update as you resize so just do it at the end
                miniNav.updateMiniNavInnerComponentSizes(currentZoom);

                $('.grid').css({
                    visibility: 'hidden'
                });
            }
        });
    };

    that.createComponentContainer = function(component, zoom) {
        var container = $('<div></div>');
        var containerId = 'component-container_'+component.meta.id;
        container.addClass('cell dropped component-container containing-cell').attr('id', containerId);
        container.height(component.dimensions.height * zoom).width(component.dimensions.width * zoom);
        container.data('componentId', component.meta.id);

        makeContainerResizable(container, component);

        var optionsDropdown = $('<div class="dropdown inner-component-options-small">'+
            '<button class="btn btn-default dropdown-toggle btn-xs" type="button" data-toggle="dropdown">'+
            '<span class="glyphicon glyphicon-option-vertical"></span></button>'+
            '<ul class="dropdown-menu">'+
            '</ul>'+
            '</div>');

        var buttonEdit = $('<li>' +
            '<a href="#" class="edit-btn">' +
            '<span class="glyphicon glyphicon-pencil"></span>' +
            '</a>' +
            '</li>');

        buttonEdit.attr('id', 'edit-btn' + '_' + component.meta.id);

        buttonEdit.on("click", function (e) {
            container.find('.tooltip').addClass('open');
        });

        var buttonTrash = $('<li>' +
            '<a href="#" class="inner-component-trash">' +
            '<span class="glyphicon glyphicon-trash"></span>' +
            '</a>' +
            '</li>');

        buttonTrash.attr('id', 'inner-component-trash' + '_' + component.meta.id);

        buttonTrash.click(function(){
            deleteComponentFromUserComponentAndFromView(component.meta.id)
        });

        optionsDropdown.find('.dropdown-menu').append(buttonEdit).append('<li class="divider"></li>').append(buttonTrash);
        container.append(optionsDropdown);



        return container;
    };

    that.setUpContainer = function(container, widget, component, zoom){
        container.append(widget);
        var type = widget.attr('name');
        var properties;
        if (component){
            var html = view.getHTML[type](component.components[type]);
            properties = component.properties;
        } else {
            var html = view.getHTML[type]();
        }
        view.displayInnerComponent(container, type, html, zoom, properties);

    };

    return that;
};
