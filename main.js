const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const url = require('url');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
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
              mainWindow.webContents.send('menu-open-videos');
            }
          },
          {
            label: 'Export Collage',
            accelerator: 'CmdOrCtrl+E',
            click: () => {
              mainWindow.webContents.send('menu-export-collage');
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
app.whenReady().then(createWindow);

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

// IPC handlers for any backend functionality needed
ipcMain.on('request-mainprocess-action', (event, arg) => {
  console.log('Received request in main process:', arg);
  // Handle any requests from the renderer process here
  
  // Example response
  event.reply('mainprocess-response', { result: 'success' });
});