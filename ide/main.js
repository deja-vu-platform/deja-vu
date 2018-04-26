'use strict';
const fs = require('fs');
const path = require('path');

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const ipcMain = electron.ipcMain;

// Angular and electron help from https://scotch.io/tutorials/build-a-music-player-with-angular-2-electron-i-setup-basics-concepts
require('dotenv').config();

// from http://electron.atom.io/docs/tutorial/quick-start/

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    'min-height': 500,
    'min-width': 850,
    backgroundColor: '#ffffff'
    // icon: `file://${__dirname}/dist/assets/logo.png`
  });
  
  const ses = mainWindow.webContents.session;
  
  // start out with clean local storage
  ses.clearStorageData({storages: 'localstorage'}, function () {
    // if it is the release environment
    if (process.env.PACKAGE === 'true') {
      mainWindow.loadURL(`file://${__dirname}/dist/index.html`);
    } else { // if development environment
      // and load the index.html of the app from where angular serves it.
      mainWindow.loadURL(process.env.HOST);
      // Open the DevTools.
      mainWindow.webContents.openDevTools();
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // clean out any local data
    ses.clearStorageData({storages: 'localstorage'}, function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
        mainWindow = null;
      });
  });
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('read', function (event, args) {
  const send = function(files) {
    mainWindow.webContents.send('read-success', { files: files });    
  }

  const dir = getFullPath(args.dir);

  try {
    fs.accessSync(dir, fs.F_OK);
  } catch (e) {
    // The folder hasn't been created yet.
    fs.mkdir(dir, function(err) {
      if (err) {
        console.log(err);
        return;
      }
      send([]);  
    });
  }

  readFiles(dir, function (err, files) {
    if (err) {
      console.log(err);
      return;
    }
    send(files);
  });
});

ipcMain.on('delete', function (event, args) {
  deleteFile(args.filename, function (err) {
    if (err) {
      console.log(err);
      return;
    }
    mainWindow.webContents.send('delete-success', args);
  });
});

ipcMain.on('save', function (event, args) {
  saveObjectToFile(getFullPath(args.dir), args.filename, args.content, function (err) {
    if (err) {
      console.log(err);
      return;
    }
    mainWindow.webContents.send('save-success', args);
  });
});

// from http://stackoverflow.com/questions/10049557/reading-all-files-in-a-directory-store-them-in-objects-and-send-the-object
function readFiles(dirname, onFinish) {
  const files = [];
  fs.readdir(
    dirname,
    function (err1, filenames) {
      if (err1) {
        onFinish(err1);
        return;
      }
      if (filenames.length === 0) {
        onFinish(null, files);
      }

      let numFilesProcessed = 0;
      filenames.forEach(function (filename) {
        fs.readFile(
          path.join(dirname, filename),
          'utf-8',
          function (err2, content) {
            if (err2) {
              onFinish(err2);
              return;
            }
            files.push([filename, content]);  
            numFilesProcessed += 1;
            if (numFilesProcessed === filenames.length) {
              onFinish(null, files);
            }
          }
        );
      });
    }
  );
}

function saveObjectToFile(dirname, filename, object, onFinish) {
  const pathName = path.join(dirname, filename);
  fs.writeFile(pathName, JSON.stringify(object), onFinish);
}

function isCopyOfFile(dirname, filename) {
  const pathName = path.join(dirname, filename);
  try {
    const stats = fs.statSync(pathName);
    return true;
  } catch (err) {
    return false;
  }
}

function deleteFile(filename, onFinish) {
  const pathName = path.join(getFullPath(args.dir), filename);
  fs.stat(pathName, function (err1, stats) {
    if (err1) {
      console.error(err1);
      return;
    }
    fs.unlink(pathName, function (err2) {
      if (err2) {
        console.log(err2);
        return;
      }
      onFinish();
    });
  });
}

function getFullPath(dir){
  // The projects are currently stored at the root of the app.
  // TODO have an option to allow users to put in where they want
  // their projects saved. 
  return path.join(__dirname, dir);
}