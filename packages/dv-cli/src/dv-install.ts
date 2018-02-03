import * as program from 'commander';
import * as _ from 'lodash';
import {
  npm, updateDvConfig, updatePackage, concurrentlyCmd, buildFeCmd,
  buildServerCmd, startServerCmd, UsedCliche
} from './dv';


const APP_MODULE_PATH = 'src/app/app.module.ts';

program
  .version('0.0.1')
  // hyphen if name has more than one word
  .arguments('<name> <loc>')
  .option(
    '-a, --as [name]', 'use the specified name to refer to this cliché')
  .action((name, loc, opts) => {
    console.log(opts);
    console.log(`Installing cliché ${name} from ${loc}`);
    npm(['install', loc + '/dist']);

    console.log('Update dvconfig.json');
    const usedCliche: UsedCliche = {
      name: name,
      startServer: true,
      watch: true
    };
    if (opts.as) {
      usedCliche.as = opts.as;
    }

    updateDvConfig(dvConfig => {
      if (dvConfig.usedCliches == undefined) {
        usedCliche.config = { wsPort: 3002 };
        dvConfig.usedCliches = [ usedCliche ];
      } else {
        usedCliche.config = {
          wsPort: dvConfig.usedCliche.slice(-1)[0].config.wsPort + 1
        };
        dvConfig.usedCliches = dvConfig.usedCliches + usedCliche;
      }
      return dvConfig;
    });

    console.log('Add start and watch scripts to package.json');
    const alias = opts.as ? opts.as : name;
    const serverDistFolder = `node_modules/${name}/dist/server`;
    // TODO: Only do this if cliche has a server
    // u never want to hardcode the config in the cmd
    updatePackage(pkg => {
      // pkg.scripts[`dv-build-${alias}`] = concurrentlyCmd(
      //   buildFeCmd(false, loc), buildServerCmd(false, loc));
      pkg.scripts[`dv-build-${alias}`] = `(cd ${loc}; chokidar 'src/app/${name}' 'server') | (cd ${loc}; npm run dv-package) && npm run dv-build-thisone`
      pkg.scripts[`dv-build-watch-${alias}`] = concurrentlyCmd(
        buildFeCmd(true, loc), buildServerCmd(true, loc));

      pkg.scripts[`dv-start-${alias}`] = startServerCmd(
        false, serverDistFolder, `usedCliches.${alias}.config`, opts.as);
      pkg.scripts[`dv-start-watch-${alias}`] = startServerCmd(
        true, serverDistFolder, `usedCliches.${alias}.config`, opts.as);

      return pkg;
    });

    console.log('Modify the app module');
    console.log(
      `Edit ${APP_MODULE_PATH}:\n
         - add "import { ${moduleClassName(name)} } from '${name}';"\n
         - add "${moduleClassName(name)}" to the imports array\n
       This will be automated in the future`);
  })
  .parse(process.argv);


function moduleClassName(clicheName: string): string {
  return _.chain(clicheName).camelCase().capitalize().value() + 'Module';
}
