const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Configuration du stockage persistant
const store = new Store({
  name: 'bibliotheque-pyreneenne-data'
});

// Gardez une référence globale de l'objet window
let mainWindow;

function createWindow() {
  // Créer la fenêtre du navigateur
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Optionnel
    title: 'Bibliothèque Pyrénéenne'
  });

  // Charger l'index.html de l'application
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Ouvrir les DevTools en mode développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Émis lorsque la fenêtre est fermée
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Cette méthode sera appelée quand Electron a fini de s'initialiser
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // Sur macOS, il est commun de re-créer une fenêtre dans l'application
    if (mainWindow === null) createWindow();
  });
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
