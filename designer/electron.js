/* eslint-disable import/no-extraneous-dependencies */
const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');

const gateway = require('@deja-vu/gateway');

const serveDir = __dirname + '/.serve-assets';
const assetsDir = serveDir + '/assets';
const requestProcessor = gateway.startGateway(
  undefined, undefined, serveDir); // port 3000 default


function startElectron(url, serveDelay = 0) {
  let win;

  const createWindow = () => setTimeout(() => {
    win = new BrowserWindow({
      width: 600,
      height: 600,
      backgroundColor: '#ffffff',
      icon: `file://${__dirname}/dist/assets/logo.png`,
      webPreferences: { nodeIntegration: true },
    });

    win.maximize();

    win.loadURL(url);

    if (isDev) {
      win.webContents.openDevTools();
    }

    win.on('closed', () => {
      win = null;
    });
  }, serveDelay);

  app.on('ready', () => {
    createWindow();
  });

  app.on('window-all-closed', () => {
    // On macOS specific close process
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // macOS specific close process
    if (win === null) {
      createWindow();
    }
  });
}

module.exports = {
  startElectron,
  assetsDir,
  requestProcessor, // designer imports this to manage concepts dynamically
};
