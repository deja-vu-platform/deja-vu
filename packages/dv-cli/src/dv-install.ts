import * as program from 'commander';
import * as _ from 'lodash';
import {
  npm, updateDvConfig, updatePackage, startServerCmd, UsedCliche, DvConfig,
  NG_PACKAGR
} from './dv';

import { existsSync } from 'fs';
import * as path from 'path';


const APP_MODULE_PATH = path.join('src', 'app', 'app.module.ts');

program
  .version('0.0.1')
  // hyphen if name has more than one word
  .arguments('<name> <loc>')
  .option(
    '-a, --as [name]', 'use the specified name to refer to this cliché')
  .action((name, loc, opts) => {
    if (!existsSync(loc)) {
      throw new Error(`Path ${loc} doesn't exist`);
    }
    console.log(opts);
    console.log(`Packaging cliché ${name} from ${loc}`);
    npm(['run', `dv-package-${name}`], loc);
    
    console.log(`Installing cliché ${name} from ${loc}`);
    npm([
      'install', path.join(loc, NG_PACKAGR.configFileContents.dest), '--save']);

    console.log('Update dvconfig.json');
    const usedCliche: UsedCliche = {
      name: name,
      startServer: true,
      watch: true
    };
    if (opts.as) {
      usedCliche.as = opts.as;
    }

    updateDvConfig((dvConfig: DvConfig) => {
      if (_.isEmpty(dvConfig.usedCliches)) {
        usedCliche.config = { wsPort: 3002 };
        dvConfig.usedCliches = [ usedCliche ];
      } else {
        usedCliche.config = {
          wsPort: dvConfig.usedCliches.slice(-1)[0].config.wsPort + 1
        };
        dvConfig.usedCliches.push(usedCliche);
      }
      return dvConfig;
    });

    console.log('Add start and watch scripts to package.json');
    const alias = opts.as ? opts.as : name;
    const cd = (cmd: string) => `(cd ${loc}; ${cmd})`;
    const serverDistFolder = path.join('node_modules', name, 'server');
    // TODO: this assumes cliche has a server
    updatePackage(pkg => {
      pkg.scripts[`dv-package-${alias}`] = cd(
        `npm run dv-package-${name}`);
      pkg.scripts[`dv-package-watch-${alias}`] = cd(
        `npm run dv-package-watch-${name}`);
      pkg.scripts[`dv-start-${alias}`] = startServerCmd(
        false, serverDistFolder, `usedCliches.${alias}.config`, opts.as);
      pkg.scripts[`dv-start-watch-${alias}`] = startServerCmd(
        true, serverDistFolder, `usedCliches.${alias}.config`, opts.as);

      pkg.scripts[`dv-reinstall-watch-${alias}`] = (
        `chokidar ${path.join(loc, NG_PACKAGR.configFileContents.dest)} -c "` +
        `rm -rf node_modules/${name} && npm i"`
      );

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
