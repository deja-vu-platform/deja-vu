/**
 * Created by Shinjini on 3/27/2017.
 */

var WidgetListDisplay = function(){
    var that = Object.create(WidgetListDisplay.prototype);

    var recursivelyLoadWidgetIntoList = function(widget, clicheId, listElt){

        // keeps the structure instead of linearizing so it can have a folding structure
        var recursiveListMakerHelper = function(innerWidgetList, parentElt){
            innerWidgetList.forEach(function(item){
                if (Array.isArray(item)){
                    var innerList= item;
                    var ul = $('<ul>');
                    recursiveListMakerHelper(innerList, ul);
                    parentElt.append(ul);
                } else {
                    var innerWidgetId = item;
                    var widgetInfo = widget.getInnerWidget(innerWidgetId).meta;
                    var elt = $(
                        '<li data-type="'+'user'+'" class="widget not-draggable inner-widget" data-componentid="' + widgetInfo.id + '" data-clicheid=' + clicheId + '>'
                        + '<div class="component-name-container">'
                        + '<span class="component-name">' + widgetInfo.name + '</span>'
                        + '<div class="submit-rename not-displayed">'
                        + '<input type="text" class="new-name-input form-control" autofocus>'
                        + '</div>'
                        + '</div>'
                        + '</li>');
                    parentElt.append(elt);
                }

            });
        };

        var innerWidgetsInfoList = widget.getAllInnerWidgetsIds(true);

        var list = $('<ul>');
        recursiveListMakerHelper(innerWidgetsInfoList, list);
        listElt.find('.inner-widgets').append(list);

        return list;
    };

    that.loadClicheIntoWidgetList = function(cliche, widgetToLoadId){
        var usedWidgetsIds = cliche.getAllUsedWidgetIds();
        var userAppId = userApp.meta.id;
        if (cliche.meta.id == userAppId){
            userApp.getAllOuterWidgetIds().forEach(function(widgetId){
                var widgetName;
                if (widgetId in userApp.widgets.pages){
                    widgetName = userApp.widgets.pages[widgetId].meta.name;
                    var listElt = displayNewWidgetInMainPagesList(widgetName, widgetId, userAppId);
                    recursivelyLoadWidgetIntoList(userApp.widgets.pages[widgetId], userAppId, listElt);
                } else if (widgetId in userApp.widgets.unused){
                    widgetName = userApp.widgets.unused[widgetId].meta.name;
                    var listElt = displayUnusedWidgetInList(widgetName, widgetId, userAppId);
                    recursivelyLoadWidgetIntoList(userApp.widgets.unused[widgetId], userAppId, listElt);
                } else if (widgetId in userApp.widgets.templates) {
                    widgetName = userApp.widgets.templates[widgetId].meta.name;
                    displayNewWidgetTemplateInList(widgetName, widgetId, userAppId);
                }
            });
            if (widgetToLoadId){
                that.select(widgetToLoadId);
            }
            usedWidgetsIds.forEach(function(id){
                var widget = cliche.getWidget(id);
                var listElt = displayUsedWidgetInList(widget.meta.name, widget.meta.id, userAppId);
                recursivelyLoadWidgetIntoList(widget, userAppId, listElt);
            });

        } else {
            // TODO
        }
    };

    /**
     * Adds a component to the list of user components
     * @param newComponent
     */
    var displayUnusedWidgetInList = function(name, id, clicheId){
        // TODO changes in style
        var newWidgetElt = $(
            '<li data-type="'+'user'+'" class="widget" data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
            + '<div class="component-name-container">'
            + '<span class="component-name">' + name + '</span>'
            + '<div class="submit-rename not-displayed">'
            + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</div>'
            + '<div class="delete-button-container"></div>'
            + '</div>'
            + '<ul class="inner-widgets"></ul>'
            + '</li>');
        $('#user-components-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
        return newWidgetElt;
    };

    var displayUsedWidgetInList = function(name, id, clicheId){
        // TODO changes in style
        var newWidgetElt = $(
            '<li data-type="'+'user'+'" class="widget not-draggable" data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
            + '<div class="component-name-container">'
            + '<span class="component-name">' + name + '</span>'
            + '<div class="submit-rename not-displayed">'
            + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</div>'
            + '<div class="delete-button-container"></div>'
            + '</div>'
            + '<ul class="inner-widgets"></ul>'
            + '</li>');
        $('#user-used-components-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        return newWidgetElt;
    };


    /**
     * Adds a component to the list of main pages
     * @param newComponent
     */
    var displayNewWidgetInMainPagesList = function(name, id, clicheId){
        // TODO changes in style
        var newWidgetElt = $(
            '<li data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
            + '<div class="component-name-container">'
            + '<div class="component-name">' + name + '</div>'
            + '<div class="submit-rename not-displayed">'
            + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</div>'
            + '</div>'
            + '<div class="index-page-toggle">'
            + '</div>'
            + '<div class="delete-button-container"></div>'
            + '<ul class="inner-widgets"></ul>'
            + '</li>');
        $('#main-pages-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        return newWidgetElt;
    };

    var displayNewWidgetTemplateInList = function(name, id, clicheId){
        // TODO changes in style
        var newWidgetElt = $(
            '<li data-type="'+'user'+'" class="widget" data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
            + '<div class="component-name-container">'
                + '<div class="component-name">' + name + '</div>'
                + '<div class="submit-rename not-displayed">'
                    + '<input type="text" class="new-name-input form-control" autofocus>'
                + '</div>'
                + '<div class="delete-button-container"></div>'
            + '</div>'
            + '<ul class="inner-widgets"></ul>'
            + '</li>');
        $('#widget-templates-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
    };

    that.select = function(id){
        $('.selected').removeClass("selected");
        $("[data-componentid='" + id + "']").addClass('selected');
    };

    that.refresh = function(){
        $('.widget-list').html("");
        that.loadClicheIntoWidgetList(userApp, selectedUserWidget.meta.id);
    };

    that.updateDraggables = function(selectedWidget){
        // first enable all draggables
        $('.widget').each(function(idx, elt){
            elt = $(elt);
            if (elt.data('uiDraggable')){
                elt.draggable('enable');
            }
        });
        // then disable the relevant ones
        userApp.getAllOuterWidgetIds().forEach(function(widgetId){
            var widget = userApp.getWidget(widgetId);
            var path = widget.getPath(selectedWidget.meta.id);
            path.forEach(function(pathWidgteId){ // note this includes the selectedWidgetId
                var dragHandle = $('.components').find('[data-componentid='+pathWidgteId+']');
                if (dragHandle.data('uiDraggable')){
                    dragHandle.draggable('disable');
                }
            });
        });
    };

    Object.freeze(that);
    return that;
};