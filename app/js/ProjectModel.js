/** ** ** ** Constants ** ** ** **/
var DEFAULT_PROJECT_NAME = "New Project";
var DEFAULT_AUTHOR = "Unknown";
var DEFAULT_VERSION = '0.0.1';
/** ** ** ** ** ** ** ** ** ** **/


/**
 * Project
 * @returns {Project}
 * @constructor
 */
function Project() {
    this.objectType = "Project";
    //this.type = '';
    this.meta = {};
    this.components = {};
    this.componentIdSet = {};
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
    this.components = {};
    this.componentIdSet = {id:''};
}

UserProject.prototype.addComponent = function(componentId, component){
    this.components[componentId] = component;
};


UserProject.prototype.removeComponent = function(componentId){
    delete this.components[componentId];
};


//selectedUserProject = new UserProject(DEFAULT_PROJECT_NAME, 1, DEFAULT_VERSION, DEFAULT_AUTHOR);
//selectedUserComponent.addComponent({}, 2, 3);