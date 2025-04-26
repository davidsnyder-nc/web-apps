// Entry point for the Video Collage Mac App
console.log('Starting Video Collage Mac App...');

// Import required modules
const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

function createWindow() {
  console.log('Creating main window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    // Mac app specific settings
    titleBarStyle: 'hiddenInset', // More native macOS look
    vibrancy: 'under-window', // Add vibrancy effect (macOS only)
    visualEffectState: 'active' // Keep the vibrancy effect active
  });

  // Load the index page from the electron-app directory
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'electron-app', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Create macOS menu
  if (process.platform === 'darwin') {
    const template = [
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'File',
        submenu: [
          {
            label: 'Open Videos',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [
                  { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'webm'] }
                ]
              }).then(result => {
                if (!result.canceled && result.filePaths.length > 0) {
                  mainWindow.webContents.send('menu-open-videos', result.filePaths);
                }
              }).catch(err => {
                console.error('Error opening file dialog:', err);
              });
            }
          },
          {
            label: 'Export Collage',
            accelerator: 'CmdOrCtrl+E',
            click: () => {
              dialog.showSaveDialog({
                title: 'Export Video Collage',
                defaultPath: 'video-collage.mp4',
                filters: [
                  { name: 'MP4 Video', extensions: ['mp4'] }
                ]
              }).then(result => {
                if (!result.canceled) {
                  mainWindow.webContents.send('menu-export-collage', result.filePath);
                }
              }).catch(err => {
                console.error('Error opening save dialog:', err);
              });
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'delete' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ]
      }
    ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  console.log('Electron ready, creating window...');
  createWindow();
});

// Quit when all windows are closed, except on macOS where it's common for
// applications to stay open until the user quits explicitly with Cmd + Q
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked and no other
  // windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for communication between main and renderer processes
ipcMain.on('request-mainprocess-action', (event, arg) => {
  console.log('Received request in main process:', arg);
  
  switch (arg.action) {
    case 'open-videos':
      dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'webm'] }
        ]
      }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
          event.reply('mainprocess-response', { 
            action: 'open-videos',
            success: true,
            filePaths: result.filePaths
          });
        } else {
          event.reply('mainprocess-response', { 
            action: 'open-videos',
            success: false,
            reason: 'No files selected'
          });
        }
      }).catch(err => {
        console.error('Error opening file dialog:', err);
        event.reply('mainprocess-response', { 
          action: 'open-videos',
          success: false,
          reason: err.message
        });
      });
      break;
      
    case 'export-collage':
      dialog.showSaveDialog({
        title: 'Export Video Collage',
        defaultPath: 'video-collage.mp4',
        filters: [
          { name: 'MP4 Video', extensions: ['mp4'] }
        ]
      }).then(result => {
        if (!result.canceled) {
          event.reply('mainprocess-response', { 
            action: 'export-collage',
            success: true,
            filePath: result.filePath
          });
        } else {
          event.reply('mainprocess-response', { 
            action: 'export-collage',
            success: false,
            reason: 'Export cancelled'
          });
        }
      }).catch(err => {
        console.error('Error opening save dialog:', err);
        event.reply('mainprocess-response', { 
          action: 'export-collage',
          success: false,
          reason: err.message
        });
      });
      break;
      
    default:
      event.reply('mainprocess-response', { 
        success: false,
        reason: `Unknown action: ${arg.action}`
      });
  }
});

console.log('App initialization complete.');