export interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

/**
 * Get the config for the cliche with the given name.
 * @param  name the cliche name used to generate the default config
 * @param  argv the args to get additional config details from
 * @return      the resulting config
 */
export function getConfig(name: string, argv): Config {
  return {...getDefaultConfig(name), ...getConfigArg(argv)};
}

function getDefaultConfig(name: string): Config {
  return {
    dbHost: 'localhost',
    dbPort: 27017,
    wsPort: 3000,
    dbName: `${name}-db`,
    reinitDbOnStartup: true
  }
}

function getConfigArg(argv) {
  let configArg;
  try {
    configArg = JSON.parse(argv.config);
    return configArg;
  } catch (e) {
    throw new Error(`Couldn't parse config ${argv.config}`);
  }
}
