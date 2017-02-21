'use strict';

const assert = require('assert');
const fs = require('fs');
const childProcess = require('child_process');
const path = require('path');

function spawn(command, args, options) {
  const prettyCommand = `${options && options.cwd || process.cwd()}: ${command} ${args.join(' ')}`;
  console.log(prettyCommand)
  const spawnedProcess = childProcess.spawn(command, args, options);

  return new Promise((resolve, reject) => {
    spawnedProcess.once('exit', exitCode => {
      resolve(Promise.resolve().then(() => {
        if (exitCode !== 0) {
          throw new Error(`The command '${prettyCommand}' exited with a status code of ${exitCode}`);
        }
      }));
    });
  }).catch(err => {
    spawnedProcess.kill();
    console.error(err);
  });
}

function installAll(directory) {
  if (fs.existsSync(path.join(directory, 'package.json'))) {
    return spawn('npm', ['install'], { cwd: directory })
      .then(() => spawn('typings', ['install'], { cwd: directory }))
      .then(() => {
        if (require(path.join(directory, 'package.json')).scripts.lib) {
          return spawn('npm', ['run', 'lib'], { cwd: directory });
        }
      });
  } else {
    return Promise.all(fs.readdirSync(directory)
      .filter(filename => fs.statSync(path.join(directory, filename)).isDirectory())
      .map(subdirectory => path.join(directory, subdirectory))
      .map(installAll));
  }
}

installAll(__dirname);
