/**
 * Created by Shinjini on 11/3/2016.
 */

var WidgetContainer = function(){
    var that = Object.create(WidgetContainer.prototype);


    var makeContainerResizable = function(widget, outerWidget, container){
        var widgetId = widget.meta.id;

        var dragHandle_se = $('<span></span>');
        dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
        dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
        dragHandle_se.attr('id', 'drag-handle-se' + '_' + widgetId);

        var dragHandle_sw = $('<span></span>');
        dragHandle_sw.html('<img src="images/drag_handle_sw_icon.png" width="15px" height="15px">');
        dragHandle_sw.addClass('ui-resizable-handle ui-resizable-sw drag-handle');
        dragHandle_sw.attr('id', 'drag-handle-sw' + '_' + widgetId);

        var dragHandle_ne = $('<span></span>');
        dragHandle_ne.html('<img src="images/drag_handle_ne_icon.png" width="15px" height="15px">');
        dragHandle_ne.addClass('ui-resizable-handle ui-resizable-ne drag-handle');
        dragHandle_ne.attr('id', 'drag-handle-se' + '_' + widgetId);

        var dragHandle_nw = $('<span></span>');
        dragHandle_nw.html('<img src="images/drag_handle_nw_icon.png" width="15px" height="15px">');
        dragHandle_nw.addClass('ui-resizable-handle ui-resizable-nw drag-handle');
        dragHandle_nw.attr('id', 'drag-handle-nw' + '_' + widgetId);

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
                widget.properties.dimensions.height = ui.size.height/currentZoom;
                widget.properties.dimensions.width = ui.size.width/currentZoom;
                // TODO woah! It resizes as you go!
                refreshContainerDisplay(false, container, currentZoom);
            },
            stop: function(e, ui){
                outerWidget.properties.layout[widget.meta.id].left = ui.position.left/currentZoom;
                outerWidget.properties.layout[widget.meta.id].top = ui.position.top/currentZoom;
                // not super important to update as you resize so just do it at the end
                miniNav.updateMiniNavInnerWidgetSizes(outerWidget, currentZoom);
                grid.setUpGrid();
                $('.grid').css({
                    visibility: 'hidden'
                });
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


    var createEditOptions = function(widget, outerWidget, container){
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

        buttonEdit.attr('id', 'edit-btn' + '_' + widget.meta.id);


        var buttonStyle = $('<li class="dropdown-submenu">'+
                                '<a tabindex="-1" href="#" class="inner-component-style">Style</a>'+
                                '<ul class="dropdown-menu inner-component-style-dropdown">'+
                                    '<li class="dropdown-submenu">'+
                                        '<a tabindex="-1" href="#" class="inner-component-custom-style">Custom</a>'+
                                        '<ul class="dropdown-menu inner-component-custom-style-dropdown">'+
                                        '</ul>'+
                                    '</li>'+
                                    '<li class="dropdown-submenu">'+
                                        '<a tabindex="-1" href="#" class="inner-component-premade-style">Premade</a>'+
                                        '<ul class="dropdown-menu inner-component-premade-style-dropdown">'+
                                        '</ul>'+
                                    '</li>'+
                                    '<li class="divider"></li>'+
                                    '<li>' +
                                        '<a tabindex="-1" href="#" class="inner-component-delete-style">Clear Styles</a>'+
                                    '</li>'+
                                '</ul>'+
                            '</li>');



        var buttonTrash = $('<li>' +
            '<a href="#" class="inner-component-trash">' +
            '<span class="glyphicon glyphicon-trash"></span>' +
            '</a>' +
            '</li>');

        var buttonMoveUp = $('<li>' +
            '<a href="#" class="inner-component-move-up">' +
            '<span>Move Up</span>' +
            '</a>' +
            '</li>');
        var buttonMoveDown = $('<li>' +
            '<a href="#" class="inner-component-move-up">' +
            '<span>Move Down</span>' +
            '</a>' +
            '</li>');

        buttonTrash.attr('id', 'inner-component-trash' + '_' + widget.meta.id);

        optionsDropdown.find('.dropdown-menu')
            .append(buttonEdit)
            .append('<li class="divider"></li>')
            .append(buttonStyle)
            .append('<li class="divider"></li>')
            .append(buttonTrash)
            .append('<li class="divider"></li>')
            .append(buttonMoveUp)
            .append(buttonMoveDown);

        // behaviour

        optionsDropdown.find('.inner-component-options-dropdown, .inner-component-style,' +
            ' .inner-component-custom-style, .inner-component-premade-style').each(function(idx, elt){
            $(elt).click(function(e){
                var thisElt = elt;
                toggleOpenClose(e, $(thisElt).parent());
            });
        });

        buttonStyle.find('.inner-component-delete-style').click(function(e){
            e.stopPropagation();

            // TODO this is wrong, because at this point I'm supposed to go back and read the old colors
            // TODO that were previously overwritten
            widget.properties.styles.custom = {};
            widget.properties.styles.bsClasses = {};
            /////////////

            outerWidget.properties.children[widget.meta.id] = {};
            refreshContainerDisplay(false, container, currentZoom);

        });

        buttonEdit.on("click", function (e) {
            e.stopPropagation();
            container.find('.tooltip').addClass('open');
        });


        buttonTrash.click(function(){
            deleteWidgetFromUserWidgetAndFromView(widget.meta.id)
        });

        buttonMoveUp.click(function(){
           WorkSurface().changeOrderByOne(widget.meta.id, outerWidget, true);
        });


        buttonMoveDown.click(function(){
            WorkSurface().changeOrderByOne(widget.meta.id, outerWidget, false);
        });

        return optionsDropdown;
    };


    that.createBasicWidgetContainer = function(widget, zoom){
        var container = $('<div></div>');
        var containerId = 'component-container_'+widget.meta.id;
        container.addClass('cell dropped component-container containing-cell').attr('id', containerId);
        container.height(widget.properties.dimensions.height * zoom).width(widget.properties.dimensions.width * zoom);
        container.data('componentId', widget.meta.id);
        return container;
    };

    that.createEditableWidgetContainer = function(widget, outerWidget, zoom) {
        var container = that.createBasicWidgetContainer(widget, zoom);
        makeContainerResizable(widget, outerWidget, container);
        container.append(createEditOptions(widget, outerWidget, container));
        return container;
    };

    var setUpTextOptions = function(container, widget, path){
        var customStyles = {};
        if (path){ // FIXME make more robust
            customStyles = getCustomStylesGivenPath(path);
        }

        //
        // if (!widget.properties.styles.custom){
        //     widget.properties.styles.custom = {}
        // }

        var fontSizeOption = $('<li><div>Font Size: </div></li>');
        var fontWeightOption = $('<li><div>Font Weight: </div></li>');
        var fontSizeInput = $('<input class="font-size-input">');
        var fontWeightInput = $('<input class="font-weight-input">');
        var fontSizeSetButton = $('<button class="btn font-size-set-button">Set</button>');
        var fontWeightSetButton = $('<button class="btn font-size-set-button">Set</button>');

        fontSizeOption.append(fontSizeInput).append(fontSizeSetButton);
        fontWeightOption.append(fontWeightInput).append(fontWeightSetButton);
        container.find('.inner-component-custom-style-dropdown').append(fontSizeOption).append(fontWeightOption);


        fontSizeSetButton.click(function(){
            var value = fontSizeInput.val();
            if (!isNaN(parseInt(value))){
                updateCustomStylesGivenPath(path, {'font-size': value + 'px'});

                // customStyles['font-size'] = value + 'px';
                widget.properties.styles.custom['font-size'] = value + 'px';
                refreshContainerDisplay(false, container, currentZoom);

            }

        });

        fontWeightSetButton.click(function(){
            var value = fontWeightInput.val();
            if (!isNaN(parseInt(value))){
                updateCustomStylesGivenPath(path, {'font-weight': value});
                // customStyles['font-weight'] = value;
                widget.properties.styles.custom['font-weight'] = value;
                refreshContainerDisplay(false, container, currentZoom);

            }
        });

    };

    var createCustomPropertyGivenPath = function(path){
        var currPath = selectedUserWidget.properties;
        path.forEach(function(pathVal, idx){
            if (idx != 0){
                if (!currPath.children[pathVal]){
                    currPath.children[pathVal] = {children:{}};
                }
                currPath = currPath.children[pathVal];
            }

        });
        return currPath;
    };

    var getCustomPropertyGivenPath = function(path){
        var currPath = selectedUserWidget.properties;
        var noProperty = false;
        path.forEach(function(pathVal, idx){
            if (!noProperty){
                if (idx != 0){
                    if (!currPath.children[pathVal]){
                        noProperty = true;
                        currPath = {};
                    } else {
                        currPath = currPath.children[pathVal];
                    }
                }
            }
        });

        return currPath;

    };

    var getCustomStylesGivenPath = function(path){
        var changes = getCustomPropertyGivenPath(path);
        if (changes.styles) {
            if (changes.styles.custom){
                return changes.styles.custom;
            }
        }
        return {};
    };


    var createCustomStylesGivenPath = function(path){
        var changes = createCustomPropertyGivenPath(path);
        if (!changes.styles) {
            changes.styles = {};
        }
        if (!changes.styles.custom){
            changes.styles.custom = {};
        }
        return changes.styles.custom;
    };

    var updateCustomStylesGivenPath = function(path, newCustomStyles){
        var customStyles = createCustomStylesGivenPath(path);
        for (var style in newCustomStyles){
            customStyles[style] = newCustomStyles[style];
        }
    };

    var setUpColorOptions = function(container, widget, path){
        var customStyles = {};
        if (path){ // FIXME make more robust
            customStyles = getCustomStylesGivenPath(path);
        }

        var textColorOption = $('<li><div>Text Color: </div></li>');
        var bgColorOption = $('<li><div>Background Color: </div></li>');
        var textColorInput = $('<input class="color-input">');
        var bgColorInput = $('<input class="color-input">');
        textColorOption.append(textColorInput);
        bgColorOption.append(bgColorInput);


        var pickerText = new jscolor(textColorInput[0]);
        pickerText.closable = true;
        pickerText.closeText = 'X';
        textColorInput.change(function(e){
            e.stopPropagation();
            var color = pickerText.toHEXString();
            // customStyles['color'] = color;
            updateCustomStylesGivenPath(path, {'color': color});
            // update both the inner widget's property and also save it in the outer widget
            widget.properties.styles.custom['color'] = color;
            refreshContainerDisplay(false, container, currentZoom);
        });

        var pickerBG = new jscolor(bgColorInput[0]);
        pickerBG.closable = true;
        pickerBG.closeText = 'X';
        bgColorInput.change(function(e){
            e.stopPropagation();
            var color = pickerBG.toHEXString();
            // customStyles['background-color'] = color;
            updateCustomStylesGivenPath(path, {'background-color': color});
            // update both the inner widget's property and also save it in the outer widget
            widget.properties.styles.custom['background-color'] = color;
            refreshContainerDisplay(false, container, currentZoom);
        });

        var textColor = customStyles['color'] || '000000'; // TODO
        pickerText.fromString(textColor);

        var bgColor = customStyles['background-color'] || 'FFFFFF'; // TODO
        pickerBG.fromString(bgColor);

        container.find('.inner-component-custom-style-dropdown').append(textColorOption).append(bgColorOption);
    };

    var showConfigOptions = function(droppedWidgetType, container) {
        // Hide edit button if label or panel
        if (droppedWidgetType=='label' || droppedWidgetType=='panel') {
            container.find('.edit-btn').css('display', 'none');
        } else {
            container.find('.edit-btn').css('display', 'block');
        }

        var labelProperties = $('.default-properties').find('.'+droppedWidgetType+'-properties').clone();

        if (labelProperties.length==0) {
            return;
        }
        var configOptions = labelProperties.find('.config-btns');

        configOptions.children().each(function(idx, elt){
            var li = $('<li class="dropdown-submenu"></li>');
            li.append($(elt).children());
            (function(){
                var thisLi = li;
                li.find('.dropdown-toggle').click(function(e){
                    toggleOpenClose(e, thisLi);
                });
            })();

            li.find('.premade-style').click(function(e){
                e.stopPropagation();
            });


            container.find('.inner-component-premade-style-dropdown').append(li);
        });
        container.find('.inner-component-style-dropdown').append(configOptions);
    };

    that.setUpContainer = function(container, dragHandle, widget, associated, outerMostWidget){
        var type = dragHandle.data('type');
        container.append(dragHandle);
        if (associated){
            var path = getPath(outerMostWidget, widget.meta.id);
            showConfigOptions(type, container);
            setUpColorOptions(container, widget, path);
            setUpTextOptions(container, widget, path);
        }
    };


    Object.freeze(that);
    return that;
};
