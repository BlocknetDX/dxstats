const electron = require('electron');
const fs = require('fs-extra-promise');
const isDev = require('electron-is-dev');
const path = require('path');
const SimpleStorage = require('./src-back/storage');
const serve = require('electron-serve');
const { createBgManager } = require('./src-back/background-manager');

const { platform } = process;

let appWindow, serverLocation, storage, p2pPermissions;

// General Error Handler
const handleError = err => {
  console.error(err);
  if(appWindow) {
    appWindow.send('error', { name: err.name, message: err.message });
  }
};

// Handle any uncaught exceptions
process.on('uncaughtException', err => {
  handleError(err);
});

let loadURL;
if(!isDev) {
  loadURL = serve({directory: 'dist'});
}

const { app, BrowserWindow, Menu, ipcMain } = electron;

require('electron-context-menu')();

// Only allow one application instance to be open at a time
const isSecondInstance = app.makeSingleInstance(() => {});
if(isSecondInstance) app.quit();

const openSettingsWindow = (options = {}) => {

  let errorMessage;

  ipcMain.on('saveData', (e, items) => {
    try {
      for(const key of Object.keys(items)) {
        const value = items[key];
        if(key === 'password' && !value && storage.getItem('password')) continue;
        storage.setItem(key, value, true);
      }
      e.sender.send('dataSaved');
    } catch(err) {
      handleError(err);
    }
  });
  ipcMain.on('restart', () => {
    app.relaunch();
    app.quit();
  });

  const settingsWindow = new BrowserWindow({
    show: false,
    width: 500,
    height: platform === 'win32' ? 520 : 530,
    parent: appWindow
  });
  if(isDev) {
    settingsWindow.loadURL(`file://${path.join(__dirname, 'src', 'settings.html')}`);
  } else {
    settingsWindow.loadURL(`file://${path.join(__dirname, 'dist', 'settings.html')}`);
  }
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    if(errorMessage) {
      settingsWindow.send('errorMessage', errorMessage);
    }
  });

  if(isDev) {
    const menuTemplate = [];
    menuTemplate.push({
      label: 'Window',
      submenu: [
        { label: 'Show Dev Tools', role: 'toggledevtools' }
      ]
    });
    const windowMenu = Menu.buildFromTemplate(menuTemplate);
    settingsWindow.setMenu(windowMenu);
  }
};

const openTOSWindow = (alreadyAccepted = false) => {

  ipcMain.on('getTOS', e => {
    try {
      const text = fs.readFileSync(path.join(__dirname, 'tos.txt'), 'utf8');
      e.returnValue = text;
    } catch(err) {
      console.error(err);
    }
  });
  ipcMain.on('cancelTOS', () => {
    app.quit();
  });
  ipcMain.on('acceptTOS', () => {
    storage.setItem('tos', true, true);
    app.relaunch();
    app.quit();
  });
  ipcMain.on('alreadyAccepted', e => {
    e.returnValue = alreadyAccepted;
  });

  let height;
  if(process.platform === 'win32') {
    height = alreadyAccepted ? 660 : 735;
  } else {
    height = alreadyAccepted ? 645 : 720;
  }

  const tosWindow = new BrowserWindow({
    show: false,
    width: 500,
    height: height,
    parent: appWindow
  });
  if(isDev) {
    tosWindow.loadURL(`file://${path.join(__dirname, 'src', 'tos.html')}`);
  } else {
    tosWindow.loadURL(`file://${path.join(__dirname, 'dist', 'tos.html')}`);
  }
  tosWindow.once('ready-to-show', () => {
    tosWindow.show();
  });

  if(isDev) {
    const menuTemplate = [];
    menuTemplate.push({
      label: 'Window',
      submenu: [
        { label: 'Show Dev Tools', role: 'toggledevtools' }
      ]
    });
    const windowMenu = Menu.buildFromTemplate(menuTemplate);
    tosWindow.setMenu(windowMenu);
  }
};

const startBackground = () => {
  const backgroundWindow = new BrowserWindow({
    show: false
  });
  try {
    createBgManager(appWindow, backgroundWindow);
  } catch(err) {
    console.error(err);
  }
};

const openAppWindow = () => {

  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  appWindow = new BrowserWindow({
    show: false,
    width: width - 100,
    height: height - 100
  });

  appWindow.maximize();

  if(isDev) {
    appWindow.loadURL(serverLocation);
  } else {
    loadURL(appWindow);
  }

  appWindow.once('ready-to-show', () => {
    appWindow.show();
  });

  appWindow.once('show', () => {

  });

  const menuTemplate = [];

  // File Menu
  menuTemplate.push({
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  });

  // Edit Menu
  menuTemplate.push({
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' }
    ]
  });

  // Window Menu
  if(isDev) {
    menuTemplate.push({
      label: 'Window',
      submenu: [
        { label: 'Show Dev Tools', role: 'toggledevtools' }
      ]
    });
  }

  const appMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(appMenu);

  ipcMain.on('isFirstRun', e => {
    const isFirstRun = storage.getItem('isFirstRun');
    if(isFirstRun !== false) {
      storage.setItem('isFirstRun', false);
      e.returnValue = true;
    } else {
      e.returnValue = false;
    }
  });

  ipcMain.on('openSettings', () => {
    openSettingsWindow();
  });

  ipcMain.on('openTOS', () => {
    openTOSWindow(true);
  });

};

const onReady = new Promise(resolve => app.on('ready', resolve));

// Run the application within async function for flow control
(async function() {
  try {
    const { name } = fs.readJSONSync(path.join(__dirname, 'package.json'));
    let dataPath;
    if(process.platform === 'win32') {
      dataPath = path.join(process.env.LOCALAPPDATA, 'BLOCKDX-Explorer');
      fs.ensureDirSync(dataPath);
    } else {
      dataPath = app.getPath('userData');
    }

    storage = new SimpleStorage(path.join(dataPath, 'meta.json'));
    p2pPermissions = storage.getItem('p2p_permission');

    if(!storage.getItem('addresses')) {
      storage.setItem('addresses', {});
    }

    if(!storage.getItem('tos')) {
      await onReady;
      openTOSWindow();
      return;
    }

    if(!p2pPermissions) {
      await onReady;
      openSettingsWindow();
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const localhost = 'localhost';

    // In development use the live ng server. In production serve the built files
    if(isDev) {
      serverLocation =  `http://${localhost}:4200`;
    }

    await onReady;

    openAppWindow();
    startBackground();

  } catch(err) {
    handleError(err);
  }

})();

// Properly close the application
app.on('window-all-closed', () => {
  app.quit();
});
