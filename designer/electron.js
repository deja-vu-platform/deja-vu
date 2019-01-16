/* eslint-disable import/no-extraneous-dependencies */
const { app, BrowserWindow } = require('electron');

function startElectron(url, serveDelay = 0) {
  let win;

  const createWindow = () => setTimeout(() => {
    // Create the browser window.
    win = new BrowserWindow({
      width: 600,
      height: 600,
      backgroundColor: '#ffffff',
      icon: `file://${__dirname}/dist/assets/logo.png`,
    });

    win.loadURL(url);

    // uncomment below to open the DevTools.
    // win.webContents.openDevTools()

    // Event when the window is closed.
    win.on('closed', () => {
      win = null;
    });
  }, serveDelay);

  // Create window on electron intialization
  app.on('ready', () => {
    createWindow();
  });

  // Quit when all windows are closed.
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

module.exports = startElectron;
