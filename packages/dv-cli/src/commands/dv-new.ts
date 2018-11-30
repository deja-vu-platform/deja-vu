exports.command = 'new <type>';
exports.desc = 'create a new app or cliché';
exports.builder = (yargs) => yargs.commandDir('dv-new')
  .demandCommand();
