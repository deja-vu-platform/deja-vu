exports.command = 'new <type>';
exports.desc = 'create a new cliché or component';
exports.builder = (yargs) => yargs.commandDir('dv-new')
  .demandCommand();
