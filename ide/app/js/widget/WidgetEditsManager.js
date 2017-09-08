/**
 * Created by Shinjini on 2/2/2017.
 */


var WidgetEditsManager = function(){
    var that = Object.create(WidgetEditsManager.prototype);

    // TODO make this general
    // TODO make this robust
    that.updateCustomProperties = function(outermostWidget, targetId, typeString, newProperties, forParent){
        var path = outermostWidget.getPath(targetId);
        if (forParent){
            targetId = path[path.length - 2];
        }
        var targetWidget = userApp.getWidget(targetId);
        if (!targetWidget.overrideProperties){
            targetWidget.overrideProperties = {};
        }
        if (typeString == 'styles.custom'){
            if (!targetWidget.overrideProperties.styles){
                targetWidget.overrideProperties.styles = {};
            }
            if (!targetWidget.overrideProperties.styles.custom){
                targetWidget.overrideProperties.styles.custom = {};
            }
            for (var property in newProperties){
                targetWidget.overrideProperties.styles.custom[property] = newProperties[property];
            }
        } else if (typeString == 'value'){
            targetWidget.innerWidgets[newProperties.type] = newProperties.value;
        } else if (typeString == 'layout'){
            for (var id in newProperties){
                targetWidget.properties.layout[id] = newProperties[id];
            }
            targetWidget.overrideProperties.layout = targetWidget.properties.layout;
        } else if (typeString == 'stackOrder'){
            targetWidget.properties.layout.stackOrder = newProperties;
            targetWidget.overrideProperties.layout = targetWidget.properties.layout;
        } else {
            // TODO is this right??
            // FIXME problem with dot notation
            if (!targetWidget.overrideProperties[typeString]){
                targetWidget.overrideProperties[typeString] = {};
            }
            for (var property in newProperties){
                targetWidget.overrideProperties[typeString][property] = newProperties[property];
            }
        }

        that.refreshPropertyValues(outermostWidget);
        that.updateAllWidgetsUsingTemplate(targetId);

    };



    // property name can be of the form "asdas.asda" like "layout.stackOrder"
    // TODO Make more robust
    that.clearCustomProperties = function(targetId, propertyName){
        var outermostWidget = userApp.getWidget(userApp.findUsedWidget(targetId)[1]);
        var targetWidget = userApp.getWidget(targetId);

        var customProperties = targetWidget.overrideProperties ||{};//that.getCustomProperty(outermostWidget, targetId);
        if (!propertyName){
            for (var property in customProperties){
                delete customProperties[property];
                delete targetWidget.properties[property];
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
                targetWidget.properties.styles.custom = {};
            }
            if (propertyName == 'styles.bsClasses'){
                if (customProperties.styles){
                    delete customProperties.styles.bsClasses;
                }
                targetWidget.properties.styles.bsClasses = {};
            }
            //else if (propertyName == 'layout'){
            //    targetWidget.properties.layout = {stackOrder:[]};
            //}
            else {
                delete customProperties[propertyName];
                targetWidget.properties[propertyName] = {};
            }
        }
        that.refreshPropertyValues(outermostWidget);
    };



    that.getMostRelevantOverallCustomChanges = function(outermostWidget, targetId){
        // if path is just the outer widget's id, will just return outerWidget.properties
        var change = {};
        var updateChange = function(widget){
            change = $.extend(change, widget.properties.styles);

            if (widget.overrideProperties) {
                if (widget.overrideProperties.styles) {
                    change = $.extend(change, widget.overrideProperties.styles);
                }
            }
        };

        // add properties of the outermost widget
        updateChange(outermostWidget);

        var path = outermostWidget.getPath(targetId);
        // else go down and find the correct one
        for (var pathValueIdx = 0; pathValueIdx<path.length-1; pathValueIdx++){
            var outerWidget = outermostWidget.getInnerWidget(path[pathValueIdx]);
            // moving down so that the inner styles override the outer styles
            updateChange(outerWidget);
        }
        return change;
    };

    var isFromTemplate = function(widget){
        var fromTemplate = true;
        var templateClicheId;
        var templateWidgetId;

        var templateIds = widget.meta.templateId;
        if (templateIds){
            var clicheAndWidgetId = getClicheAndWidgetIdFromTemplateId(templateIds);
            templateClicheId = clicheAndWidgetId.clicheId;
            templateWidgetId = clicheAndWidgetId.widgetId;

            if (templateClicheId == userApp.meta.id){
                // might not be there, at which point need to just continue
                if (!(templateWidgetId in userApp.widgets.templates)){
                    fromTemplate = false;
                }
            }
        } else {
            fromTemplate = false
        }
        return {fromTemplate: fromTemplate, clicheId:templateClicheId, widgetId: templateWidgetId};
    };

    /**
     * Goes down each level recursively.
     * As it goes up, it reads from the source code (Project) to override changes
     * @param outermostWidget
     */
    var applyPropertyChangesAtAllLevelsBelow = function(outermostWidget){
        var recursiveApplyPropertyChangesHelper = function(widgetToModify){
            if (widgetToModify.type == 'user') {
                widgetToModify.properties.layout.stackOrder.forEach(function (innerWidgetId) {
                    var innerWidget = widgetToModify.innerWidgets[innerWidgetId];
                    recursiveApplyPropertyChangesHelper(innerWidget);
                });

            }


            var templateVersionCopy;
            var templateInfo = isFromTemplate(widgetToModify);
            if (templateInfo.fromTemplate){
                templateVersionCopy = UserWidget.fromString(
                    JSON.stringify(
                        selectedProject.cliches[templateInfo.clicheId].widgets.templates[templateInfo.widgetId]
                    )
                );

            } else {
                templateVersionCopy = widgetToModify;
            }



            // apply changes after calling the recursion so that higher levels override
            // lower level changes
            applyPropertyChanges(widgetToModify, templateVersionCopy);

            return widgetToModify
        };

        recursiveApplyPropertyChangesHelper(outermostWidget);

    };


    var getMappings = function(widgets){
        var widgetToTemplate = {};
        var templateToWidget = {};
        for (var id in widgets){
            widgetToTemplate[id] = widgets[id].meta.templateCorrespondingId;
            templateToWidget[widgets[id].meta.templateCorrespondingId] = id;
        }

        return {wTT: widgetToTemplate, tTW: templateToWidget}

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

        var insertPropertiesIntoWidget = function(widget, overrideProperties, fromTemplate, mappings){
            // if there is a change, override the old one
            if (overrideProperties){
                if (overrideProperties.styles){
                    if (overrideProperties.styles.custom){
                        var customStyles = overrideProperties.styles.custom;
                        if (!widget.properties.styles.custom){
                            widget.properties.styles.custom = {}
                        }
                        for (var style in customStyles) {
                            widget.properties.styles.custom[style] = customStyles[style];
                        }
                    }
                    if (overrideProperties.styles.bsClasses){
                        var bsClasses = overrideProperties.styles.bsClasses;
                        if (!widget.properties.styles.bsClasses){
                            widget.properties.styles.bsClasses = {}
                        }
                        for (var bsClass in customStyles) {
                            widget.properties.styles.bsClasses[bsClass] = bsClasses[bsClass];
                        }
                    }
                }

                // don't do the following if reading from a template, but this is not the corresponding widget
                // (i.e., the properties are from the widget itself
                if (!(fromTemplate && !mappings)){
                    if (overrideProperties.dimensions) {
                        widget.properties.dimensions = overrideProperties.dimensions;
                    }

                    if (overrideProperties.layout) {
                        for (var id in overrideProperties.layout){
                            var mappedId = mappings? mappings.tTW[id]: id;
                            if (id != 'stackOrder'){
                                widget.properties.layout[mappedId] = overrideProperties.layout[id];
                            } else {
                                // since you can only add (and not delete or move) widgets to the used template,
                                // the lower elements in the stack order are the original components
                                // and the others are the new components which we don't change
                                overrideProperties.layout.stackOrder.forEach(function(id, i){
                                    var mappedId = mappings? mappings.tTW[id]: id;
                                    widget.properties.layout.stackOrder[i] = mappedId;
                                });
                            }
                        }
                    }
                }

                if (overrideProperties.value){
                    widget.innerWidgets[overrideProperties.value.type] = overrideProperties.value.value;
                }
            }

        };


        var applyPropertyChangesHelper = function(innerWidget, sourceInnerWidget){
            var fromTemplate = (innerWidget.meta.id != sourceInnerWidget.meta.id);
            if (fromTemplate){
                if (innerWidget.type == 'user'){
                    var idMappings = getMappings(innerWidget.innerWidgets);
                    // get any new additions
                    Object.keys(sourceInnerWidget.innerWidgets).forEach(function (innerInnerSourceWidgetId) {
                        var innerInnerSourceWidget = sourceInnerWidget.innerWidgets[innerInnerSourceWidgetId];

                        var innerInnerWidgetId = idMappings.tTW[innerInnerSourceWidgetId];
                        if (!innerInnerWidgetId){
                            var innerInnerWidget = createUserWidgetCopy(innerInnerSourceWidget, null, true);
                            innerInnerWidgetId = innerInnerWidget.meta.id;
                            innerWidget.innerWidgets[innerInnerWidgetId] = innerInnerWidget;
                            innerWidget.properties.layout.stackOrder.push(innerInnerWidgetId);
                            innerWidget.properties.layout[innerInnerWidgetId] =
                                innerWidget.properties.layout[innerInnerSourceWidgetId]
                        }
                    });
                }

                var updatedIdMappings = getMappings(innerWidget.innerWidgets);

                // get source properties
                var sourceProperties = sourceInnerWidget.overrideProperties;
                insertPropertiesIntoWidget(innerWidget, sourceProperties, fromTemplate, updatedIdMappings);
                // get changed properties
                var properties = innerWidget.overrideProperties;
                insertPropertiesIntoWidget(innerWidget, properties, fromTemplate);

                if (innerWidget.type == 'user'){
                    // then recurse down
                    // now all the widgets are there
                    Object.keys(innerWidget.innerWidgets).forEach(function (innerInnerWidgetId) {
                        var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];

                        var innerInnerSourceWidgetId = updatedIdMappings.wTT[innerInnerWidgetId];
                        var innerInnerSourceWidget = sourceInnerWidget.innerWidgets[innerInnerSourceWidgetId];
                        if (innerInnerSourceWidget){
                            applyPropertyChangesHelper(innerInnerWidget, innerInnerSourceWidget);
                        } else if (innerInnerSourceWidgetId) {
                            // check if it's deleted
                            if (outerWidget.meta.templateId){
                                var clicheAndWidgetId = getClicheAndWidgetIdFromTemplateId(outerWidget.meta.templateId);
                                var templateWidgetId = clicheAndWidgetId.widgetId;
                                // check if the outermost widget we are updating using is the actual template
                                // this is to protect against un-updated copies of the template
                                if (templateWidgetId == sourceWidget.meta.id){
                                    innerWidget.deleteInnerWidget(innerInnerWidgetId);
                                }
                            }

                        }

                    });
                }


            } else {
                // get changed properties
                var properties = innerWidget.overrideProperties;
                var thisFromTemplate = innerWidget.meta.templateCorrespondingId? true: false;
                insertPropertiesIntoWidget(innerWidget, properties, thisFromTemplate);


                if (innerWidget.type == 'user'){
                    // then recurse down
                    Object.keys(innerWidget.innerWidgets).forEach(function (innerInnerWidgetId) {
                        var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];
                        applyPropertyChangesHelper(innerInnerWidget, innerInnerWidget);
                    });
                }

            }
        };

        if (!sourceWidget){ // if this is a new added component?
            sourceWidget = outerWidget;
        }

        // apply the properties to all lower levels
        applyPropertyChangesHelper(outerWidget, sourceWidget);

    };

    var getClicheAndWidgetIdFromTemplateId = function(templateId){
        var clicheAndWidgetId = templateId.split('_');
        var clicheId = clicheAndWidgetId[clicheAndWidgetId.length - 2];
        var widgetId = clicheAndWidgetId[clicheAndWidgetId.length - 1];
        return {clicheId:clicheId,widgetId:widgetId}
    };

    var resetStyleValues = function(outerWidget){
        var templateInfo = isFromTemplate(outerWidget);
        if (templateInfo.fromTemplate){
            var templateVersion =  selectedProject.cliches[templateInfo.clicheId].widgets.templates[templateInfo.widgetId];
            outerWidget.properties.styles = JSON.parse(JSON.stringify(templateVersion.properties.styles));
        }
        if (outerWidget.type == 'user'){ // not BaseWidgets
            Object.keys(outerWidget.innerWidgets).forEach(function(id){
                resetStyleValues(outerWidget.innerWidgets[id]);
            });
        }

    };

    that.refreshPropertyValues = function(outerWidget){
        resetStyleValues(outerWidget);
        applyPropertyChangesAtAllLevelsBelow(outerWidget);

        return outerWidget
    };

    var widgetUsesTemplate = function(widget, templateId){
        if (widget.meta.templateId){
            var clicheAndWidgetId = getClicheAndWidgetIdFromTemplateId(widget.meta.templateId);
            var templateWidgetId = clicheAndWidgetId.widgetId;
            return (templateWidgetId == templateId);
        } else {
            var does = false;
            if (widget.type == 'user'){
                for (var innerWidgetId in widget.innerWidgets){
                    var innerWidget = widget.innerWidgets[innerWidgetId];
                    does = does || widgetUsesTemplate(innerWidget, templateId);
                }

            }
            return does;
        }
    };


    that.updateAllWidgetsUsingTemplate = function(changingWidgetId){
        //var template = userApp.findUsedWidget(changingWidgetId)[1];
        //if (template){
        //    if (template.isTemplate){
        //        userApp.getAllOuterWidgetIds().forEach(function(widgetId){
        //            var widget = userApp.getWidget(widgetId);
        //            var path = widget.getPath(template.meta.id);
        //            path.forEach(function(pathWidgetId){ // note this includes the selectedWidgetId
        //                var pathWidget = userApp.getWidget(pathWidgetId);
        //                widgetEditsManager.refreshPropertyValues(pathWidget);
        //            });
        //        });
        //    }
        //}

        var recursivelyUpdateWidgetsUsingTemplate = function(allOuterWidgetIds, changingWidgetId) {
            var templateId = userApp.findUsedWidget(changingWidgetId)[1];
            if (templateId){
                var template = userApp.getWidget(templateId);
                if (template && template.isTemplate){
                    allOuterWidgetIds.forEach(function(widgetId){
                        var widget = userApp.getWidget(widgetId);
                        if (widgetUsesTemplate(widget, templateId)){
                            widgetEditsManager.refreshPropertyValues(widget);
                            recursivelyUpdateWidgetsUsingTemplate(allOuterWidgetIds, widgetId);
                        }
                    });
                }
            }

        };

        var allOuterWidgetIds = userApp.getAllOuterWidgetIds();
        recursivelyUpdateWidgetsUsingTemplate(allOuterWidgetIds, changingWidgetId)
    };

    Object.freeze(that);
    return that;
};