exports.command = 'generate <type> <name>';
exports.desc = 'runs a specific generator';
exports.builder = yargs => yargs.commandDir('dv-generate')
  .demandCommand(1);
