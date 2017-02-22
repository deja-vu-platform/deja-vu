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
    this.mainComponent = null;
    this.components = {};
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
    this.mainComponent = null; // one component for now
    this.components = {};
    this.lastAccessed = new Date();

}

UserProject.prototype.addComponent = function(component){
    if (!this.components[component.meta.id]) {
        this.components[component.meta.id] = component;
    }
};

UserProject.prototype.removeComponent = function(componentId){
    delete this.components[componentId];
    delete this.mainComponent[componentId];
};


// TODO Ummm this should be fixed
UserProject.prototype.makeMainComponent = function(component){
    if (component.meta.id in this.components){
        this.mainComponent = component.meta.id;
    }
};

UserProject.prototype.removeMainComponent = function(){
    selectedProject.mainComponent = null;

};

UserProject.prototype.getNumComponents = function(){
    return Object.keys(this.components).length;
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

    var project = $.extend(new UserProject(), object);

    for (var componentId in object.components) {
        var component = object.components[componentId];
        project.components[componentId] = UserComponent.fromObject(component);
    }
    return project
};
