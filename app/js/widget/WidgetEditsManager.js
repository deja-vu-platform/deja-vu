/**
 * Created by Shinjini on 2/2/2017.
 */


var WidgetEditsManager = function(){
    var that = Object.create(WidgetEditsManager.prototype);

    var getOrCreateCustomProperty = function(outermostWidget, targetId){
        var path = outermostWidget.getPath(targetId);

        var currPath = outermostWidget.properties;
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


    // TODO make this general
    // TODO make this robust
    that.updateCustomProperties = function(outermostWidget, targetId, typeString, newProperties, forParent){
        var path = outermostWidget.getPath(targetId);
        if (forParent){
            targetId = path[path.length - 2];
        }

        var createCustomPropertyOfType = function(outermostWidget, targetId, typeString){
            var types = typeString.split('.');

            var changes = getOrCreateCustomProperty(outermostWidget, targetId);
            types.forEach(function(type){
                if (!changes[type]){
                    changes[type] = {};
                }
                changes = changes[type];
            });
            return changes;
        };


        var updateCustomPropertiesHelper = function(outermostWidget, targetId, typeString, newProperties){
            var targetWidget = outermostWidget.getInnerWidget(targetId);
            var changes = createCustomPropertyOfType(outermostWidget, targetId, typeString);

            if (typeString == 'styles.custom'){
                for (var property in newProperties){
                    changes[property] = newProperties[property];
                    targetWidget.properties.styles.custom[property] = newProperties[property];
                }
            } else if (typeString == "stackOrder"){
                // changes = newProperties;
                // widget.properties.layout.stackOrder = newProperties;
            } else if (typeString == 'value'){
                for (var property in newProperties){
                    changes[property] = newProperties[property];
                }
                targetWidget.innerWidgets[newProperties.type] = newProperties.value;
            } else {
                // TODO is this right??
                // FIXME problem with dot notation
                for (var property in newProperties){
                    changes[property] = newProperties[property];
                    // this might have problems with dot notation
                    targetWidget.properties[typeString][property] = newProperties[property];
                }
            }
        };

        updateCustomPropertiesHelper(outermostWidget, targetId, typeString, newProperties);
        that.applyPropertyChangesAtAllLevelsBelow(outermostWidget);
    };


    that.getCustomProperty = function(outermostWidget, targetId){
        var path = outermostWidget.getPath(targetId);

        var currPath = outermostWidget.properties;
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



    // property name can be of the form "asdas.asda" like "layout.stackOrder"
    // TODO Make more robust
    that.clearCustomProperties = function(targetId, propertyName){
        var outermostWidget = userApp.getWidget(userApp.findUsedWidget(targetId)[1]);

        var path = outermostWidget.getPath(targetId);

        var customProperties = that.getCustomProperty(outermostWidget, targetId);
        var widget = outermostWidget.getInnerWidget(path[path.length-1]);
        if (!propertyName){
            for (var property in customProperties){
                delete customProperties[property];
                delete widget.properties[property];
            }
        } else {
            if (customProperties[propertyName]){
                // TODO fix for dot notation
                delete customProperties[propertyName];
            }
            if (propertyName == 'styles.custom'){
                if (customProperties.styles){
                    delete customProperties.styles.custom;
                }
                widget.properties.styles.custom = {};
                widget.properties.styles.bsClasses = {};
            } else if (propertyName == 'layout'){
                widget.properties.layout = {stackOrder:[]};
            } else {
                widget.properties[propertyName] = {};
            }
        }
        that.applyPropertyChangesAtAllLevelsBelow(outermostWidget);
    };



    that.getMostRelevantOverallCustomChanges = function(outermostWidget, targetId){
        // if path is just the outer widget's id, will just return outerWidget.properties
        var change = JSON.parse(JSON.stringify(outermostWidget.properties.styles.custom));
        var outerWidget = outermostWidget;
        var path = outermostWidget.getPath(targetId);

        // else go down and find the correct one
        for (var pathValueIdx = 1; pathValueIdx<path.length; pathValueIdx++){
            if (outerWidget.innerWidgets[path[pathValueIdx]]){
                outerWidget = outerWidget.innerWidgets[path[pathValueIdx]];
                // moving down so that the inner styles override the outer styles
                if (!$.isEmptyObject(outerWidget.properties.styles.custom)){
                    for (var style in outerWidget.properties.styles.custom){
                        change[style] = outerWidget.properties.styles.custom[style];
                    }
                }
            } else {
                break;
            }
        }
        return change;
    };

    that.applyPropertyChangesAtAllLevelsBelow = function(outermostWidget){
        var recursiveApplyPropertyChangesHelper = function(widgetToModify){
            if (widgetToModify.type == 'user') {
                var template = true;

                var templateId = widgetToModify.meta.templateId;
                if (templateId){
                    var clicheAndWidgetId = getClicheAndWidgetIdFromTemplateId(templateId);
                    var templateClicheId = clicheAndWidgetId.clicheId;
                    var templateWidgetId = clicheAndWidgetId.widgetId;
                    
                    if (templateClicheId == userApp.meta.id){
                        // might not be there, at which point need to just continue
                        if (!(templateWidgetId in userApp.widgets.templates)){
                            template = false;
                        }
                    }
                } else {
                    template = false
                }

                if (template){
                    var componentVersionCopy =  UserWidget.fromString(
                        JSON.stringify(selectedProject.cliches[templateClicheId].widgets.templates[templateWidgetId])
                    );

                    widgetToModify.properties.layout.stackOrder.forEach(function (innerWidgetId) {
                        var innerWidget = widgetToModify.innerWidgets[innerWidgetId];
                        recursiveApplyPropertyChangesHelper(innerWidget);
                    });

                    // apply changes after calling the recursion so that higher levels override
                    // lower level changes
                    applyPropertyChanges(widgetToModify, componentVersionCopy);
                } else {
                    applyPropertyChanges(widgetToModify);
                }
            } else {
                // else it's a base component, so we'll just take it as is from the component we are reading from
                applyPropertyChanges(widgetToModify);
            }
            return widgetToModify
        };

        recursiveApplyPropertyChangesHelper(outermostWidget);

    };

    /**
     * Gets the changes made at the level of the outer widget and
     * puts them in the properties of the involved inner widget
     * saved in the outer widget. NOTE: this does not reference the
     * templates from the project! Use this before re-id-ing the cliches
     * or use the source widget as the id reference
     * @param outerWidget
     * @param sourceWidget
     */
    var applyPropertyChanges = function(outerWidget, sourceWidget){

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



        var insertPropertiesIntoWidget = function(widget, properties){
            // if there is a change, override the old one
            if (properties.styles){
                if (properties.styles.custom){
                    var customStyles = properties.styles.custom;
                    for (var style in customStyles) {
                        widget.properties.styles.custom[style] = customStyles[style];
                    }
                }
                if (properties.styles.bsClasses){
                    var bsClasses = properties.styles.bsClasses;
                    for (var bsClass in customStyles) {
                        widget.properties.styles.bsClasses[bsClass] = bsClasses[bsClass];
                    }
                }
            }

            if (properties.dimensions) {
                widget.properties.dimensions = properties.dimensions;
            }

            if (properties.layout) {
                // TODO this has problems because the IDs CHANGE!
                // if (!$.isEmptyObject(properties.stackOrder)) {
                //     widget.properties.layout.stackOrder = properties.layout.stackOrder;
                // }
                // FIXME this will cause unnecessary weird id stuff :(
                for (var id in properties.layout){
                    if (id != 'stackOrder'){
                        widget.properties.layout[id] = properties.layout[id];
                    }
                }
            }

            if (properties.value){
                widget.innerWidgets[properties.value.type] = properties.value.value;
            }
            if (properties.name){
                widget.meta.name = properties.name;
            }

        };

        var path = [];

        if (!sourceWidget){ // if this is a new added component?
            sourceWidget = outerWidget;
        }


        var applyPropertyChangesHelper = function(innerWidget, sourceWidget, correspondingSourceInnerWidget){

            if (!sourceWidget){
                console.log('something went wrong in applyPropertyChangesHelper()');
                console.log(innerWidget);
                console.log(selectedUserWidget.getPath(innerWidget.meta.id));
            }

            path.push(correspondingSourceInnerWidget.meta.id);

            // get changed properties
            var properties = getPropertyChanges(sourceWidget, path);

            insertPropertiesIntoWidget(innerWidget, properties);

            // if this itself is a used widget, apply the top ones
            var usingWidgetId = userApp.findUsedWidget(innerWidget.meta.id)[1];
            if (usingWidgetId){
                var usingWidget = userApp.getWidget(usingWidgetId);
                var topmostProperties = getPropertyChanges(usingWidget, usingWidget.getPath(innerWidget.meta.id));
                insertPropertiesIntoWidget(innerWidget, topmostProperties);
            }

            if (innerWidget.type == 'user'){
                // then recurse down
                innerWidget.properties.layout.stackOrder.forEach(function (innerInnerWidgetId, idx) {
                    var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];
                    // var innerInnerSourceWidgetId = innerWidget.idMap[innerInnerWidgetId];
                    var innerInnerSourceWidgetId = correspondingSourceInnerWidget.properties.layout.stackOrder[idx];
                    var innerInnerSourceWidget = correspondingSourceInnerWidget.innerWidgets[innerInnerSourceWidgetId];
                    if (!innerInnerWidget){
                        console.log(innerWidget, sourceWidget);
                    }
                    if (!innerInnerSourceWidget){
                        console.log(innerWidget, sourceWidget);
                        innerInnerSourceWidget = innerInnerWidget;
                    }
                    applyPropertyChangesHelper(innerInnerWidget, sourceWidget, innerInnerSourceWidget);
                });
            }
            path.pop();
        };

        // apply the properties to all lower levels
        applyPropertyChangesHelper(outerWidget, sourceWidget, sourceWidget);

    };

    var getClicheAndWidgetIdFromTemplateId = function(templateId){
        var clicheAndWidgetId = templateId.split('_');
        var clicheId = clicheAndWidgetId[clicheAndWidgetId.length - 2];
        var widgetId = clicheAndWidgetId[clicheAndWidgetId.length - 1];
        return {clicheId:clicheId,widgetId:widgetId}
    }

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
                        var template = true;

                        var templateId = innerWidget.meta.templateId;
                        if (templateId){
                            var clicheAndWidgetId = getClicheAndWidgetIdFromTemplateId(templateId);
                            var templateClicheId = clicheAndWidgetId.clicheId;
                            var templateWidgetId = clicheAndWidgetId.widgetId;


                            if (templateClicheId == userApp.meta.id){
                                // might not be there, at which point need to just continue
                                if (!(templateWidgetId in userApp.widgets.templates)){
                                    template = false;
                                }
                            }

                        } else {
                            template = false;
                        }

                        if (template){
                            // make a copy of the project
                            // NOTE: applying property changes requires that the widget's ids are
                            // the same as the project we are copying from since the project stores
                            // the information using the ids.
                            // We will be changing the ids altogether later on.
                            // innerWidget =  UserWidget.fromString(
                            //     JSON.stringify(userApp.widgets[templateId])
                            // );
                            innerWidget =  UserWidget.fromString(
                                JSON.stringify(selectedProject.cliches[templateClicheId].widgets.templates[templateWidgetId])
                            );

                            innerWidget.meta.templateId = templateId;

                            innerWidget = recursiveWidgetMakingHelper(innerWidget);
                        }

                        widget.innerWidgets[innerWidgetId] = innerWidget;
                    }

                    // apply changes after calling the recursion so that higher levels override
                    // lower level changes
                    // applyPropertyChanges(innerWidget);
                });
            } else {
                // else it's a base component, so we'll just take it as is from the component we are reading from
            }
            return widget
        };

        var recursiveWidget = recursiveWidgetMakingHelper(outerWidget);
        recursiveReIding(recursiveWidget, oldCopy);
        // do this after fixing ids, because at the top level the correct ids are used to store changes
        that.applyPropertyChangesAtAllLevelsBelow(recursiveWidget);

        return recursiveWidget;
    };



    that.refreshFromProject = function(outerWidget){
        var recursiveWidget = recursiveWidgetMaking(outerWidget);

        return recursiveWidget
    };







    Object.freeze(that);
    return that;
};