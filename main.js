'use strict';

//console.log(require.resolve('electron'));

var electron = require('electron');
var app = electron.app;  // Module to control application life.
//console.log(app);
var BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.

// from http://electron.atom.io/docs/tutorial/quick-start/

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 1200, height: 700, 'min-height': 500, 'min-width': 850});

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/app/projectView.html');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});