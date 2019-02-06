import { APP_MODULE_PATH, installAndConfigureGateway, ng } from '../../utils';


exports.command = 'app <name> <pathToDv>';
exports.desc = 'create a new app';
exports.handler = ({ name, pathToDv }) => {
  console.log(`Creating new app ${name}`);
  ng(['new', name, '--prefix', name]);
  installAndConfigureGateway(name, pathToDv);
  console.log(
    `Edit ${APP_MODULE_PATH}:\n
       - add "import { GATEWAY_URL, DvModule } from '@deja-vu/core';"\n
       - add "{
         provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'
         }" to the providers array\n
      - add "DvModule" to the imports array
      - every action that you load dynamically should be in entryComponents
     This will be automated in the future`);
};
