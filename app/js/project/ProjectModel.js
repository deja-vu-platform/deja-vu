/** ** ** ** Constants ** ** ** **/
const DEFAULT_PROJECT_NAME = "New Project";
const DEFAULT_AUTHOR = "Unknown";
const DEFAULT_VERSION = '0.0.1';
/** ** ** ** ** ** ** ** ** ** **/

// Useful tip from: http://stackoverflow.com/questions/7694501/class-static-method-in-javascript
//
// Think of f = new Foo(); as creating a class instance,
// Foo.prototype.bar = function(){...} as defining a shared method for the class, and
// Foo.baz = function(){...} as defining a public static method for the class.
//



/**
 * Project
 * @returns {Project}
 * @constructor
 */
function Project() {
    this.objectType = "Project";
    //this.type = '';
    this.meta = {};
    this.mainComponents = {};
    this.components = {};
    this.numComponents = 0;
    this.lastAccessed = -Infinity;
    this.addedCliches = {};
}

/**
 *
 * @param dimensions
 * @param name
 * @param id
 * @param version
 * @param author
 * @constructor
 */
UserProject.prototype = new Project();
UserProject.prototype.constructor = UserProject;
function UserProject(name, id, version, author) {
    this.objectType = "UserProject";
    //this.type = type;
    this.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };
    this.mainComponents = {}; // one component for now
    this.components = {};
    this.numComponents = 0;
    this.componentIdSet = {}; // {id:''}
    this.lastAccessed = new Date();
    this.addedCliches = {};
}

UserProject.prototype.addInnerWidget = function(component){
    if (!this.components[component.meta.id]) {
        this.components[component.meta.id] = component;
        this.numComponents++;
    }
};

UserProject.prototype.addMainPage = function(component){
    component.inMainPages = true;
    this.mainComponents[component.meta.id] = component.meta.name;
    this.addInnerWidget(component);
};

UserProject.prototype.removeMainPage = function(component){
    delete selectedProject.mainComponents[component.meta.id];
    component.inMainPages = false;
};


UserProject.prototype.removeComponent = function(componentId){
    delete this.components[componentId];
    delete this.mainComponents[componentId];
    this.numComponents--;
};

UserProject.fromString = function(string){
    var object = JSON.parse(string);
    return UserProject.fromObject(object);
};

UserProject.fromObject = function(object){
    // Check that the object has all the required fields
    var notCorrectObjectError = "notCorrectObjectError: object object is not an instance of a UserProject";
    if (!object.objectType){
        throw notCorrectObjectError;
    }
    if (!object.meta){
        throw notCorrectObjectError;
    }
    if (!object.components){
        throw notCorrectObjectError;
    }
    if (!object.componentIdSet){
        throw notCorrectObjectError;
    }

    var project = $.extend(new UserProject(), object);

    for (var componentId in object.components) {
        var component = object.components[componentId];
        object.components[componentId] = UserWidget.fromObject(component);
    }
    return project
};
