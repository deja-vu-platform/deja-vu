import { generateId, Dimensions, Position } from '../../common/utility/utility';

/** ** ** ** Constants ** ** ** **/
const DEFAULT_SCREEN_WIDTH = 2500;
const DEFAULT_SCREEN_HEIGHT = 1000;

const DEFAULT_WIDGET_NAME = 'New Widget';
/** ** ** ** ** ** ** ** ** ** **/

export enum WidgetType {
    BASE_WIDGET, USER_WIDGET, CLICHE_WIDGET
}

export interface Properties {
    dimensions: Dimensions;
    styles: {
        custom?: {};
        bsClasses?: {};
    };
    layout?: Map<number, Position>;
}

interface Meta {
    name: string;
    id: string; // id of the form 'clicheid_widgetid'
    templateid?: string;
    version?: string;
    author?: string;
}

export class Widget {
    protected widgetType: WidgetType;
    protected properties: Properties = {
        dimensions: null,
        styles: {
            custom: {},
            bsClasses: {}
        }
    };
    protected meta: Meta;
    protected isTemplate = false;

    static addWidgetToAllWidgets(
        allWidgets: Map<string, Map<string, Widget>>,
        widget: Widget) {
        if (!allWidgets[widget.getClicheId()]) {
            allWidgets[widget.getClicheId()] = new Map<string, Widget>();
        }
        allWidgets[widget.getClicheId()][widget.getId()] = widget;
    }

    static getWidget(
        allWidgets: Map<string, Map<string, Widget>>,
        widgetId: string) {
        const clicheid = Widget.decodeid(widgetId)[0];
        return allWidgets[clicheid][widgetId];
    }

    static fromObject(object: any): BaseWidget | UserWidget {
        const notCorrectObjectError = 'notCorrectObjectError: ' +
        'object object is not an instance of a Widget';
        if (object.widgetType === undefined || object.widgetType === null) {
            throw notCorrectObjectError;
        }
        if (object.widgetType === WidgetType.BASE_WIDGET) {
            return BaseWidget.fromObject(object);
        }
        return UserWidget.fromObject(object);
    }

    static encodeid(clicheid: string, widgetid: string) {
        return clicheid + '_' + widgetid;
    }

    static decodeid(id: string) {
        return id.split('_');
    }

    protected newIdFromId(id: string) {
        const clicheid = Widget.decodeid(id)[0];
        return clicheid + '_' + generateId();
    }

    getId(): string {
        return this.meta.id;
    }

    getName(): string {
        return this.meta.name;
    }

    getDimensions(): Dimensions {
        return this.properties.dimensions;
    }

    getClicheId(): string {
        return Widget.decodeid(this.meta.id)[0];
    }

    getTemplateId(): string {
        return this.meta.templateid;
    }

    getWidgetType(): WidgetType {
        return this.widgetType ;
    }

    getIsTemplate(): boolean {
        return this.isTemplate;
    }

    getCustomStyles() {
        return JSON.parse(JSON.stringify(this.properties.styles.custom));
    }

    updateCustomStyle(styleName: string, value) {
        this.properties.styles.custom[styleName] = value;
    }

    removeCustomStyle(styleName: string) {
        delete this.properties.styles.custom[styleName];
    }

    getCustomStylesWithInherits(allWidgets: Map<string, Map<string, Widget>>) {
        let templateCustomStylesWithInherits = {};
        if (this.getTemplateId()) {
            templateCustomStylesWithInherits = Widget.getWidget(allWidgets, this.getTemplateId()).getCustomStylesWithInherits();
        }
        // this widgets styles win!
        for (const style of Object.keys(this.properties.styles.custom)){
            templateCustomStylesWithInherits[style] = this.properties.styles.custom[style];
        }

        return templateCustomStylesWithInherits;
    }
}

/**
 * Base Widget model
 * @param type
 * @param widgets
 * @constructor
 */
export class BaseWidget extends Widget {
    protected widgetType = WidgetType.BASE_WIDGET;
    private type: string;
    private value: string;

    static fromObject(object: any): BaseWidget {
        if (object.widgetType !== WidgetType.BASE_WIDGET) {
            return null;
        }
        const clicheId = Widget.decodeid(object.meta.id)[0];
        return new BaseWidget(
            object.meta.name,
            object.properties.dimensions,
            object.type,
            object.value,
            clicheId,
            object.meta.id,
            object.meta.templateid,
            object.isTemplate);
    }

    constructor(
        name: string,
        dimensions: Dimensions,
        type: string,
        value: string,
        clicheid: string,
        id: string = null,
        templateid: string = null,
        isTemplate = false) {
        super();
        this.meta = {
            name: name,
            id: id ? id : clicheid + '_' + generateId(),
            templateid: templateid,
            version: '',
            author: ''
        };
        this.type = type;
        this.value = value;
        this.properties.dimensions = dimensions;
        this.isTemplate = isTemplate;
    }

    setProperty(property, value) {
        this.properties[property] = value;
    }

    setValue(value) {
        this.value = value;
    }

    makeCopy(
        allWidgets: Map<string, Map<string, Widget>>,
        fromTemplate = false):
    Widget[] {
        let templateId = this.getTemplateId();
        let isTemplate = this.isTemplate;
        if (fromTemplate && this.isTemplate) {
            // If you're making a tempate copy, you only make non-templates
            templateId = this.getId();
            isTemplate = false;
        }
        return [new BaseWidget(
            this.getName(),
            this.getDimensions(),
            this.type,
            this.value,
            this.getClicheId(),
            null, // generate a new id!
            templateId,
            isTemplate)];
    }
}

/**
 *
 * @param dimensions
 * @param name
 * @param id
 * @param version
 * @param author
 * @returns {UserWidget}
 * @constructor
 */
export class UserWidget extends Widget {
    protected widgetType  = WidgetType.USER_WIDGET;
    private innerWidgetIds: string[] = []; // Widget ids

    static fromObject(object: any):
    UserWidget {
        if (object.widgetType !== WidgetType.USER_WIDGET) {
            return null;
        }
        const clicheId = Widget.decodeid(object.meta.id)[0];
        const widget = new UserWidget(
            object.meta.name,
            object.properties.dimensions,
            clicheId,
            object.meta.id,
            object.meta.templateId,
            object.isTemplate);
        object.innerWidgetIds.forEach((id) => {
            widget.addInnerWidget(id);
        });

        return widget;
    }

    constructor(
        name: string,
        dimensions: Dimensions,
        clicheid: string,
        id: string = null,
        templateid: string = null,
        isTemplate = false) {
        super();

        this.meta = {
            name: name,
            id: id ? id : clicheid + '_' + generateId(),
            templateid: templateid,
            version: '',
            author: ''
        };
        this.properties.dimensions = dimensions;
        this.properties.layout = new Map<number, Position>();
        this.isTemplate = isTemplate;
    }

    updateDimensions(newDimensions: Dimensions) {
        this.properties.dimensions = newDimensions;
    }

    addInnerWidget(id: string, position?: Position) {
        // Now the inner widgets list is the stack order
        this.innerWidgetIds.push(id);
        this.properties.layout[id] = position ? position : { top: 0, left: 0 };
    }

    removeInnerWidget(id: string) {
        delete this.properties.layout[id];
        const index = this.innerWidgetIds.indexOf(id);
        this.innerWidgetIds.splice(index, 1);
    }

    getInnerWidgets() {
        return this.innerWidgetIds.slice();
    }

    updateInnerWidgetLayout(widgetId: string, newLayout: Position) {
        this.properties.layout[widgetId] = newLayout;
    }

    getInnerWidgetLayouts() {
        return JSON.parse(JSON.stringify(this.properties.layout));
    }

    private getPathHelper(
        allWidgets: Map<string, Map<string, Widget>>,
        widget: Widget,
        targetId: string):
    string[] | null {
        // returns path starting from this id to the wanted widget id
        // null if no path exists

        const widgetId = widget.getId();
        // Base case 1: found it
        if (widgetId === targetId) {
            return [widgetId];
        }
        // Base case 2: reached a BaseWidget without finding it
        if (widget.getWidgetType() === WidgetType.BASE_WIDGET) {
            return null;
        }
        // Recursive case, look through all the inner widgets
        for (const id of (<UserWidget>widget).innerWidgetIds) {
            const path = this.getPathHelper(allWidgets,
                Widget.getWidget(allWidgets, id), targetId);
            if (path === null) {
                continue;
            }
            // else, we've found it! return
            return [widgetId].concat(path);
        }
        // didn't find anything...
        return null;
    }

    getPath(
        allWidgets: Map<string, Map<string, Widget>>,
        widgetId: string):
    string[] | null {
        // returns path starting from this id to the wanted widget id
        // null if no path exists
        return this.getPathHelper(allWidgets, this, widgetId);
    }

    getInnerWidget(
        allWidgets: Map<string, Map<string, Widget>>,
        targetId: string,
        forParent = false):
    Widget {
        const path = this.getPath(allWidgets, targetId);
        if (path === null) { // it's not actually a child
            return null;
        }
        if (forParent) {
            targetId = path[path.length - 2];
        }
        return Widget.getWidget(allWidgets, targetId);
    }

    private getInnerWidgetInfo(
        allWidgets: Map<string, Map<string, Widget>>,
        widget: Widget,
        infoListLinearlized) {
        const outerRecursiveChildrenIds = [];
        if (widget.getWidgetType() === WidgetType.USER_WIDGET) {
            for (const innerWidgetId of (<UserWidget>widget).innerWidgetIds) {
                const innerWidget: Widget = Widget.getWidget(allWidgets, innerWidgetId);
                infoListLinearlized.push(innerWidgetId);
                const recursiveChildrenIds = this.getInnerWidgetInfo(
                    allWidgets,
                    innerWidget, infoListLinearlized);
                outerRecursiveChildrenIds
                    .push([innerWidgetId, recursiveChildrenIds]);
            }
        }
        return outerRecursiveChildrenIds;
    }

    // keepStructure: Returns a nested list structure representing the
    // structure of usage
    // recursive structure [widgetId, [recursive structure of children]]
    // expanded structure: [[id1, []], [id2, []], [id3, [recursive ids of
    // children of id3]], [id4,[recursive children of ld4]]]
    getAllInnerWidgetsIds(
        allWidgets: Map<string, Map<string, Widget>>,
        keepStructure: boolean) {
        const infoListLinearlized = [];
        const infoListStructured = this.getInnerWidgetInfo(allWidgets, this, infoListLinearlized);

        if (keepStructure) {
            return infoListStructured;
        } else {
            return infoListLinearlized;
        }
    }

    /**
     *
     * @param allWidgets
     * @param fromTemplate if this widget is not a template, this value is
     * ignored
     */
    makeCopy(
        allWidgets: Map<string, Map<string, Widget>>,
        fromTemplate = false):
    Widget[] {
        let templateId = this.getTemplateId();
        let isTemplate = this.isTemplate;
        if (fromTemplate && this.isTemplate) {
            // If you're making a tempate copy, you only make non-templates
            templateId = this.getId();
            isTemplate = false;
        }
        const copyWidget = new UserWidget(
            this.getName(),
            this.getDimensions(),
            this.getClicheId(),
            null, // generate a new id!
            templateId,
            isTemplate);
        let copyWidgets = [copyWidget];
        for (const id of this.innerWidgetIds) {
            const copyInnerWidgets = Widget.getWidget(allWidgets, id).makeCopy(allWidgets, fromTemplate);
            const innerWidgetCopy = copyInnerWidgets[0];
            const position = this.properties.layout[id];
            copyWidget.addInnerWidget(innerWidgetCopy.getId(), position);
            copyWidgets = copyWidgets.concat(copyInnerWidgets);
        }
        return copyWidgets;
    }











    // // TODO make this general
    // // TODO make this robust
    // updateCustomProperties (outermostWidget, targetId, typeString, newProperties, forParent) {
    //     var path = outermostWidget.getPath(targetId);
    //     if (forParent){
    //         targetId = path[path.length - 2];
    //     }
    //     var targetWidget = userApp.getWidget(targetId);
    //     if (!targetWidget.overrideProperties){
    //         targetWidget.overrideProperties = {};
    //     }
    //     if (typeString === 'styles.custom'){
    //         if (!targetWidget.overrideProperties.styles){
    //             targetWidget.overrideProperties.styles = {};
    //         }
    //         if (!targetWidget.overrideProperties.styles.custom){
    //             targetWidget.overrideProperties.styles.custom = {};
    //         }
    //         for (var property in newProperties){
    //             targetWidget.overrideProperties.styles.custom[property] = newProperties[property];
    //         }
    //     } else if (typeString === 'value'){
    //         targetWidget.innerWidgets[newProperties.type] = newProperties.value;
    //     } else if (typeString === 'layout'){
    //         for (var id in newProperties){
    //             targetWidget.properties.layout[id] = newProperties[id];
    //         }
    //         targetWidget.overrideProperties.layout = targetWidget.properties.layout;
    //     } else if (typeString === 'stackOrder'){
    //         targetWidget.properties.layout.stackOrder = newProperties;
    //         targetWidget.overrideProperties.layout = targetWidget.properties.layout;
    //     } else {
    //         // TODO is this right??
    //         // FIXME problem with dot notation
    //         if (!targetWidget.overrideProperties[typeString]){
    //             targetWidget.overrideProperties[typeString] = {};
    //         }
    //         for (var property in newProperties){
    //             targetWidget.overrideProperties[typeString][property] = newProperties[property];
    //         }
    //     }

    //     that.refreshPropertyValues(outermostWidget);
    //     that.updateAllWidgetsUsingTemplate(targetId);

    // };



    // // property name can be of the form "asdas.asda" like "layout.stackOrder"
    // // TODO Make more robust
    // that.clearCustomProperties = function(targetId, propertyName){
    //     var outermostWidget = userApp.getWidget(userApp.findUsedWidget(targetId)[1]);
    //     var targetWidget = userApp.getWidget(targetId);

    //     var customProperties = targetWidget.overrideProperties ||{};//that.getCustomProperty(outermostWidget, targetId);
    //     if (!propertyName){
    //         for (var property in customProperties){
    //             delete customProperties[property];
    //             delete targetWidget.properties[property];
    //         }
    //     } else {
    //         if (customProperties[propertyName]){
    //             // TODO fix for dot notation
    //             delete customProperties[propertyName];
    //         }
    //         if (propertyName === 'styles.custom'){
    //             if (customProperties.styles){
    //                 delete customProperties.styles.custom;
    //             }
    //             targetWidget.properties.styles.custom = {};
    //         }
    //         if (propertyName === 'styles.bsClasses'){
    //             if (customProperties.styles){
    //                 delete customProperties.styles.bsClasses;
    //             }
    //             targetWidget.properties.styles.bsClasses = {};
    //         }
    //         //else if (propertyName == 'layout'){
    //         //    targetWidget.properties.layout = {stackOrder:[]};
    //         //}
    //         else {
    //             delete customProperties[propertyName];
    //             targetWidget.properties[propertyName] = {};
    //         }
    //     }
    //     that.refreshPropertyValues(outermostWidget);
    // };



    // that.getMostRelevantOverallCustomChanges = function(outermostWidget, targetId){
    //     // if path is just the outer widget's id, will just return outerWidget.properties
    //     var change = {};
    //     var updateChange = function(widget){
    //         change = $.extend(change, widget.properties.styles);

    //         if (widget.overrideProperties) {
    //             if (widget.overrideProperties.styles) {
    //                 change = $.extend(change, widget.overrideProperties.styles);
    //             }
    //         }
    //     };

    //     // add properties of the outermost widget
    //     updateChange(outermostWidget);

    //     var path = outermostWidget.getPath(targetId);
    //     // else go down and find the correct one
    //     for (var pathValueIdx = 0; pathValueIdx<path.length-1; pathValueIdx++){
    //         var outerWidget = outermostWidget.getInnerWidget(path[pathValueIdx]);
    //         // moving down so that the inner styles override the outer styles
    //         updateChange(outerWidget);
    //     }
    //     return change;
    // };

    // var isFromTemplate = function(widget){
    //     var fromTemplate = true;
    //     var templateClicheId;
    //     var templateWidgetId;

    //     var templateIds = widget.meta.templateId;
    //     if (templateIds){
    //         var clicheAndWidgetId = getClicheAndWidgetIdFromTemplateId(templateIds);
    //         templateClicheId = clicheAndWidgetId.clicheId;
    //         templateWidgetId = clicheAndWidgetId.widgetId;

    //         if (templateClicheId == userApp.meta.id){
    //             // might not be there, at which point need to just continue
    //             if (!(templateWidgetId in userApp.widgets.templates)){
    //                 fromTemplate = false;
    //             }
    //         }
    //     } else {
    //         fromTemplate = false
    //     }
    //     return {fromTemplate: fromTemplate, clicheId:templateClicheId, widgetId: templateWidgetId};
    // };

    // /**
    //  * Goes down each level recursively.
    //  * As it goes up, it reads from the source code (Project) to override changes
    //  * @param outermostWidget
    //  */
    // var applyPropertyChangesAtAllLevelsBelow = function(outermostWidget){
    //     var recursiveApplyPropertyChangesHelper = function(widgetToModify){
    //         if (widgetToModify.type == 'user') {
    //             widgetToModify.properties.layout.stackOrder.forEach(function (innerWidgetId) {
    //                 var innerWidget = widgetToModify.innerWidgets[innerWidgetId];
    //                 recursiveApplyPropertyChangesHelper(innerWidget);
    //             });

    //         }


    //         var templateVersionCopy;
    //         var templateInfo = isFromTemplate(widgetToModify);
    //         if (templateInfo.fromTemplate){
    //             templateVersionCopy = UserWidget.fromString(
    //                 JSON.stringify(
    //                     selectedProject.cliches[templateInfo.clicheId].widgets.templates[templateInfo.widgetId]
    //                 )
    //             );

    //         } else {
    //             templateVersionCopy = widgetToModify;
    //         }



    //         // apply changes after calling the recursion so that higher levels override
    //         // lower level changes
    //         applyPropertyChanges(widgetToModify, templateVersionCopy);

    //         return widgetToModify
    //     };

    //     recursiveApplyPropertyChangesHelper(outermostWidget);

    // };

    // };
    // /**
    //  * Gets the changes made at the level of the outer widget and
    //  * puts them in the properties of the involved inner widget
    //  * saved in the outer widget. NOTE: this does not reference the
    //  * templates from the project! Use this before re-id-ing the cliches
    //  * or use the source widget as the id reference
    //  * @param outerWidget
    //  * @param sourceWidget
    //  */
    // var applyPropertyChanges = function(outerWidget, sourceWidget){

    //     var insertPropertiesIntoWidget = function(widget, overrideProperties, fromTemplate, mappings){
    //         // if there is a change, override the old one
    //         if (overrideProperties){
    //             if (overrideProperties.styles){
    //                 if (overrideProperties.styles.custom){
    //                     var customStyles = overrideProperties.styles.custom;
    //                     if (!widget.properties.styles.custom){
    //                         widget.properties.styles.custom = {}
    //                     }
    //                     for (var style in customStyles) {
    //                         widget.properties.styles.custom[style] = customStyles[style];
    //                     }
    //                 }
    //                 if (overrideProperties.styles.bsClasses){
    //                     var bsClasses = overrideProperties.styles.bsClasses;
    //                     if (!widget.properties.styles.bsClasses){
    //                         widget.properties.styles.bsClasses = {}
    //                     }
    //                     for (var bsClass in customStyles) {
    //                         widget.properties.styles.bsClasses[bsClass] = bsClasses[bsClass];
    //                     }
    //                 }
    //             }

    //             // don't do the following if reading from a template, but this is not the corresponding widget
    //             // (i.e., the properties are from the widget itself
    //             if (!(fromTemplate && !mappings)){
    //                 if (overrideProperties.dimensions) {
    //                     widget.properties.dimensions = overrideProperties.dimensions;
    //                 }

    //                 if (overrideProperties.layout) {
    //                     for (var id in overrideProperties.layout){
    //                         var mappedId = mappings? mappings.tTW[id]: id;
    //                         if (id != 'stackOrder'){
    //                             widget.properties.layout[mappedId] = overrideProperties.layout[id];
    //                         } else {
    //                             // since you can only add (and not delete or move) widgets to the used template,
    //                             // the lower elements in the stack order are the original components
    //                             // and the others are the new components which we don't change
    //                             overrideProperties.layout.stackOrder.forEach(function(id, i){
    //                                 var mappedId = mappings? mappings.tTW[id]: id;
    //                                 widget.properties.layout.stackOrder[i] = mappedId;
    //                             });
    //                         }
    //                     }
    //                 }
    //             }

    //             if (overrideProperties.value){
    //                 widget.innerWidgets[overrideProperties.value.type] = overrideProperties.value.value;
    //             }
    //         }

    //     };


    //     var applyPropertyChangesHelper = function(innerWidget, sourceInnerWidget){
    //         var fromTemplate = (innerWidget.meta.id != sourceInnerWidget.meta.id);
    //         if (fromTemplate){
    //             if (innerWidget.type == 'user'){
    //                 var idMappings = getMappings(innerWidget.innerWidgets);
    //                 // get any new additions
    //                 Object.keys(sourceInnerWidget.innerWidgets).forEach(function (innerInnerSourceWidgetId) {
    //                     var innerInnerSourceWidget = sourceInnerWidget.innerWidgets[innerInnerSourceWidgetId];

    //                     var innerInnerWidgetId = idMappings.tTW[innerInnerSourceWidgetId];
    //                     if (!innerInnerWidgetId){
    //                         var innerInnerWidget = createUserWidgetCopy(innerInnerSourceWidget, null, true);
    //                         innerInnerWidgetId = innerInnerWidget.meta.id;
    //                         innerWidget.innerWidgets[innerInnerWidgetId] = innerInnerWidget;
    //                         innerWidget.properties.layout.stackOrder.push(innerInnerWidgetId);
    //                         innerWidget.properties.layout[innerInnerWidgetId] =
    //                             innerWidget.properties.layout[innerInnerSourceWidgetId]
    //                     }
    //                 });
    //             }

    //             var updatedIdMappings = getMappings(innerWidget.innerWidgets);

    //             // get source properties
    //             var sourceProperties = sourceInnerWidget.overrideProperties;
    //             insertPropertiesIntoWidget(innerWidget, sourceProperties, fromTemplate, updatedIdMappings);
    //             // get changed properties
    //             var properties = innerWidget.overrideProperties;
    //             insertPropertiesIntoWidget(innerWidget, properties, fromTemplate);

    //             if (innerWidget.type == 'user'){
    //                 // then recurse down
    //                 // now all the widgets are there
    //                 Object.keys(innerWidget.innerWidgets).forEach(function (innerInnerWidgetId) {
    //                     var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];

    //                     var innerInnerSourceWidgetId = updatedIdMappings.wTT[innerInnerWidgetId];
    //                     var innerInnerSourceWidget = sourceInnerWidget.innerWidgets[innerInnerSourceWidgetId];
    //                     if (innerInnerSourceWidget){
    //                         applyPropertyChangesHelper(innerInnerWidget, innerInnerSourceWidget);
    //                     } else if (innerInnerSourceWidgetId) {
    //                         // check if it's deleted
    //                         if (outerWidget.meta.templateId){
    //                             var clicheAndWidgetId = getClicheAndWidgetIdFromTemplateId(outerWidget.meta.templateId);
    //                             var templateWidgetId = clicheAndWidgetId.widgetId;
    //                             // check if the outermost widget we are updating using is the actual template
    //                             // this is to protect against un-updated copies of the template
    //                             if (templateWidgetId == sourceWidget.meta.id){
    //                                 innerWidget.deleteInnerWidget(innerInnerWidgetId);
    //                             }
    //                         }

    //                     }

    //                 });
    //             }


    //         } else {
    //             // get changed properties
    //             var properties = innerWidget.overrideProperties;
    //             var thisFromTemplate = innerWidget.meta.templateCorrespondingId? true: false;
    //             insertPropertiesIntoWidget(innerWidget, properties, thisFromTemplate);


    //             if (innerWidget.type == 'user'){
    //                 // then recurse down
    //                 Object.keys(innerWidget.innerWidgets).forEach(function (innerInnerWidgetId) {
    //                     var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];
    //                     applyPropertyChangesHelper(innerInnerWidget, innerInnerWidget);
    //                 });
    //             }

    //         }
    //     };

    //     if (!sourceWidget){ // if this is a new added component?
    //         sourceWidget = outerWidget;
    //     }

    //     // apply the properties to all lower levels
    //     applyPropertyChangesHelper(outerWidget, sourceWidget);

    // };

    // var resetStyleValues = function(outerWidget){
    //     var templateInfo = isFromTemplate(outerWidget);
    //     if (templateInfo.fromTemplate){
    //         var templateVersion =  selectedProject.cliches[templateInfo.clicheId].widgets.templates[templateInfo.widgetId];
    //         outerWidget.properties.styles = JSON.parse(JSON.stringify(templateVersion.properties.styles));
    //     }
    //     if (outerWidget.type == 'user'){ // not BaseWidgets
    //         Object.keys(outerWidget.innerWidgets).forEach(function(id){
    //             resetStyleValues(outerWidget.innerWidgets[id]);
    //         });
    //     }

    // };
}
