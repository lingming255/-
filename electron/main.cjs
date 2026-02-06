const { app, BrowserWindow, Menu, MenuItem } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Create custom menu
  const menu = new Menu();
  
  // File Menu
  menu.append(new MenuItem({
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  }));

  // View Menu
  menu.append(new MenuItem({
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
  }));

  Menu.setApplicationMenu(menu);

  // Check if we are in development mode
  // We can check if the app is packaged or use an env var
  const isDev = !app.isPackaged;

  if (isDev) {
    // In dev, load from the Vite dev server
    win.loadURL('http://localhost:5173');
    // Open DevTools optionally
    // win.webContents.openDevTools();
  } else {
    // In production, load the index.html from the dist folder
    const fs = require('fs');
    // Check local dist first (packaged app)
    let indexPath = path.join(__dirname, 'dist/index.html');
    if (!fs.existsSync(indexPath)) {
      // Check sibling dist (dev/build local test)
      indexPath = path.join(__dirname, '../dist/index.html');
    }
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
