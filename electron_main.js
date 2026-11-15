import { app as electronApp, BrowserWindow } from 'electron';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.chdir(__dirname);
process.env.PORT = process.env.PORT || '3000';
const PORT = process.env.PORT;
const URL = `http://127.0.0.1:${PORT}`;

let mainWindow = null;

function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      http.get(url, () => resolve(true)).on('error', () => {
        if (Date.now() - start > timeout) resolve(false);
        else setTimeout(check, 150);
      });
    };
    check();
  });
}

async function createWindow() {
  await import('./src/app.js');
  await waitForServer(URL);

  mainWindow = new BrowserWindow({
    title: 'HouseBuilding Standalone',
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
    process.exit(0);
  });
}

electronApp.whenReady().then(createWindow);

electronApp.on('window-all-closed', () => {
  electronApp.quit();
  process.exit(0);
});