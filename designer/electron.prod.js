const startElectron = require('./electron.js');

startElectron(`file://${__dirname}/dist/index.html`);
