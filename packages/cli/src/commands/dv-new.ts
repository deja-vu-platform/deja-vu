exports.command = 'new <type>';
exports.desc = 'create a new cliché or action';
exports.builder = (yargs) => yargs.commandDir('dv-new')
  .demandCommand();
