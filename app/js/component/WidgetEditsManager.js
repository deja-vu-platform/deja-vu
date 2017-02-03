/**
 * Created by Shinjini on 2/2/2017.
 */


var WidgetEditsManager = function(){
    var that = Object.create(WidgetEditsManager.prototype);


    that.getPath = function(outermostWidget, widgetId){
        var wantedPath;
        var getPathHelper = function(widget, path, targetId){
            if (widget.meta){
                path.push(widget.meta.id);
                for (var id in widget.innerWidgets){
                    if (id == targetId){
                        path.push(id); // include the last id
                        wantedPath = path;
                    } else {
                        getPathHelper(widget.innerWidgets[id], JSON.parse(JSON.stringify(path)), targetId);
                    }
                }
            }
        };
        getPathHelper(outermostWidget, [], widgetId);
        return wantedPath;
    };


    that.getInnerWidget = function(outermostWidget, innerWidgetId){
        var wantedWidget;
        var getInnerWidgetHelper = function(widget, targetId){
            if (widget.meta){
                for (var id in widget.innerWidgets){
                    if (id == targetId){
                        wantedWidget = widget.innerWidgets[id];
                    } else {
                        getInnerWidgetHelper(widget.innerWidgets[id], targetId);
                    }
                }
            }
        };
        getInnerWidgetHelper(outermostWidget, innerWidgetId);
        return wantedWidget;
    };

    that.applyPropertyChangesAtAllLevel = function(outermostWidget){
        var recursiveApplyPropertyChangesHelper = function(widget){
            if (widget.type == 'user') {
                widget.properties.layout.stackOrder.forEach(function (innerWidgetId) {
                    var innerWidget = widget.innerWidgets[innerWidgetId];
                    if (innerWidget.type == 'user') {
                        var templateId = innerWidget.meta.templateId;
                        var projectCopy =  UserWidget.fromString(
                            JSON.stringify(selectedProject.components[templateId])
                        );

                        recursiveApplyPropertyChangesHelper(innerWidget);

                        // apply changes after calling the recursion so that higher levels override
                        // lower level changes
                        applyPropertyChanges(innerWidget, projectCopy);
                    } else {
                        applyPropertyChanges(innerWidget);
                    }
                });
            } else {
                // else it's a base component, so we'll just take it as is from the component we are reading from
            }
            return widget
        };

        recursiveApplyPropertyChangesHelper(outermostWidget);

    };

    /**
     * Gets the changes made at the level of the outer widget and
     * puts them in the properties of the involved inner widget
     * saved in the outer widget. NOTE: this does not reference the
     * templates from the project! Use this before re-id-ing the components
     * or use the source widget as the id reference
     * @param outerWidget
     * @param sourceWidget
     */
    applyPropertyChanges = function(outerWidget, sourceWidget){
        var getPropertyChanges = function(outerWidget, path){
            // get the changes at this level

            // if path is just the outer widget's id, will just return outerWidget.properties
            var change = outerWidget.properties;

            // else go down and find the correct one
            for (var pathValueIdx = 1; pathValueIdx<path.length; pathValueIdx++){
                if (change.children){
                    if (change.children[path[pathValueIdx]]){
                        change = change.children[path[pathValueIdx]]
                    } else {
                        change = {};
                        break;
                    }
                } else {
                    change = {};
                    break;
                }
            }
            return change;
        };

        var path = [];

        if (!sourceWidget){
            sourceWidget = outerWidget;
        }

        var applyPropertyChangesHelper = function(innerWidget, sourceInnerWidget){
            var sourceInnerWidgetId = sourceInnerWidget.meta.id;

            path.push(sourceInnerWidgetId);


            // get changed properties
            var properties = getPropertyChanges(sourceWidget, path);

            // if there is a change, override the old one
            if (properties.styles){
                if (properties.styles.custom){
                    var customStyles = properties.styles.custom;
                    for (var style in customStyles) {
                        innerWidget.properties.styles.custom[style] = customStyles[style];
                    }
                }
                if (properties.styles.bsClasses){
                    var bsClasses = properties.styles.bsClasses;
                    for (var bsClass in customStyles) {
                        innerWidget.properties.styles.bsClasses[bsClass] = bsClasses[bsClass];
                    }
                }
            }
            if (properties.dimensions) {
                innerWidget.properties.dimensions = properties.dimensions;
            }

            if (properties.layout) {
                if (properties.layout.stackOrder) {
                    innerWidget.properties.stackOrder = properties.stackOrder;
                }
                if (properties.layout){ // TODO some change in the layout?

                }
            }

            if (innerWidget.type == 'user'){
                // then recurse down
                innerWidget.properties.layout.stackOrder.forEach(function (innerInnerWidgetId, idx) {
                    var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];
                    var innerInnerSourceWidgetId = sourceInnerWidget.properties.layout.stackOrder[idx];
                    var innerInnerSourceWidget = sourceInnerWidget.innerWidgets[innerInnerSourceWidgetId];
                    applyPropertyChangesHelper(innerInnerWidget, innerInnerSourceWidget);
                });
            }
            path.pop();
        };
        applyPropertyChangesHelper(outerWidget, sourceWidget);

    };


    /**
     * Goes down each level recursively.
     * As it goes up, it reads from the source code (Project) to override changes
     * @param outerWidget
     */
    var recursiveWidgetMaking = function(outerWidget){
        var oldCopy = UserWidget.fromString(JSON.stringify(outerWidget));

        // NOTE: the returned widget does not have its IDs correct, the ids are currently the same
        // the template code it reads.
        var recursiveWidgetMakingHelper = function(widget){
            if (widget.type == 'user') {
                widget.properties.layout.stackOrder.forEach(function (innerWidgetId) {
                    var innerWidget = widget.innerWidgets[innerWidgetId];
                    if (innerWidget.type == 'user') {

                        // save the templateId here since the projectCopy does not have
                        // any idea of a template id
                        var templateId = innerWidget.meta.templateId;

                        // make a copy of the project
                        // NOTE: applying property changes requires that the widget's ids are
                        // the same as the project we are copying from since the project stores
                        // the information using the ids.
                        // We will be changing the ids altogether later on.
                        innerWidget =  UserWidget.fromString(
                            JSON.stringify(selectedProject.components[templateId])
                        );

                        innerWidget.meta.templateId = templateId;

                        innerWidget = recursiveWidgetMakingHelper(innerWidget);

                        widget.innerWidgets[innerWidgetId] = innerWidget;
                    }

                    // apply changes after calling the recursion so that higher levels override
                    // lower level changes
                    applyPropertyChanges(innerWidget);
                });
            } else {
                // else it's a base component, so we'll just take it as is from the component we are reading from
            }
            return widget
        };

        var recursiveWidget = recursiveWidgetMakingHelper(outerWidget);
        recursiveReIding(recursiveWidget, oldCopy);

        return recursiveWidget;
    };



    that.refreshFromProject = function(outerWidget){
        var recursiveWidget = recursiveWidgetMaking(outerWidget);
        applyPropertyChanges(recursiveWidget);

        return recursiveWidget
    };







    Object.freeze(that);
    return that;
};