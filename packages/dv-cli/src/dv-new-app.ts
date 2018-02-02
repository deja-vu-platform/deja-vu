import * as program from 'commander';
import { ng, installAndConfigureGateway } from './dv';

program
  .version('0.0.1')
  .arguments('<name> <pathToGateway>')
  .action((name, pathToGateway) => {
    console.log(`Creating new app ${name}`);
    ng(['new', name, '--prefix', name]);
    installAndConfigureGateway(name, pathToGateway);
  })
  .parse(process.argv);
