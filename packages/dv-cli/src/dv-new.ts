import * as program from 'commander';

program
  .version('0.0.1')
  .command('app <name>', 'create a new app')
  .command('cliche <name>', 'create a new cliche')
  .command('action <name>', 'create a new action')
  .parse(process.argv);
