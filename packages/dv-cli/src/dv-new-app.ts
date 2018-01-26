import * as program from 'commander';
import { ng } from './dv';

program
  .version('0.0.1')
  .arguments('<name>')
  .action(name => {
    console.log(`Creating new app ${name}`);
    ng(['new', name, '--prefix', name]);
  })
  .parse(process.argv);
