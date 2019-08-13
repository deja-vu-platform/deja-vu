exports.command = 'new <type>';
exports.desc = 'create a new concept or component';
exports.builder = (yargs) => yargs.commandDir('dv-new')
  .demandCommand();
