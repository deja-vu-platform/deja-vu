import * as program from 'commander';
import { ng, installAndConfigureGateway, APP_MODULE_PATH } from './dv';

program
  .version('0.0.1')
  .arguments('<name> <pathToDv>')
  .action((name, pathToDv) => {
    console.log(`Creating new app ${name}`);
    ng(['new', name, '--prefix', name]);
    installAndConfigureGateway(name, pathToDv);
    console.log(
      `Edit ${APP_MODULE_PATH}:\n
         - add "import { GATEWAY_URL, DvModule } from 'dv-core';"\n
         - add "{
           provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'
           }" to the providers array\n
        - add "DvModule" to the imports array
        - every action that you load dynamically should be in entryComponents
       This will be automated in the future`);
  })
  .parse(process.argv);
