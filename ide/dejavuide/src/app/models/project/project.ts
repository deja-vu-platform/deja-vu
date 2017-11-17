import { generateId } from '../../utility/utility';
import { UserCliche, DvCliche} from '../cliche/cliche';


export interface Meta {
  name: string;
  id: string;
  version?: string;
  author?: string;
  templateId?: string;
  clicheId?: string;
}

export class Project {
  objectType = 'Project';
  meta: Meta;
  userApp = null;
  importedCliches = new Map<string, DvCliche>();
  lastAccessed = -Infinity;

  static fromObject (object: any): Project {
    const notCorrectObject = 'Object is not an instance of a Project';
    if (object.objectType !== 'Project') {
      throw Error(notCorrectObject);
    }
    const project = new Project(object.meta.name);
    if (object.userApp) {
      project.userApp = UserCliche.fromObject(object.userApp);
    }

    for (const clicheId of Object.keys(object.importedCliches)) {
        project.importCliche(clicheId);
    }
    return project;
  }

  constructor (name) {
    this.meta = {
      name: name,
      id: generateId(),
      version: '',
      author: ''
    };

    this.lastAccessed = (new Date()).getTime();
  }

  getName(): string {
    return this.meta.name;
  }

  importCliche (clicheId) {
    // TODO figure out how importing works
    this.importedCliches.set(clicheId, null);
  }

  removeImportedCliche (clicheId) {
      this.importedCliches.delete(clicheId);
  }

  newUserApp () {
    if (this.userApp != null) {
      throw new Error('There is already a user app associated with this project');
    }
    this.userApp = new UserCliche(this.meta.name);
    return this.userApp;
  }

  getUserApp () {
    return this.userApp;
  }

  updateAccess() {
    this.lastAccessed = (new Date()).getTime();
  }

  getLastAccessed() {
    return this.lastAccessed;
  }
}
