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

// === GESTION DES ÉVÉNEMENTS IPC ===

// Exporter les données dans un fichier JSON
ipcMain.handle('export-data', async (event, data) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exporter les données',
    defaultPath: `bibliotheque-pyreneenne_${new Date().toISOString().split('T')[0]}.json`,
    filters: [
      { name: 'Fichiers JSON', extensions: ['json'] }
    ]
  });

  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, message: 'Exportation réussie' };
    } catch (err) {
      return { success: false, message: `Erreur: ${err.message}` };
    }
  }
  return { success: false, message: 'Exportation annulée' };
});

// Importer des données depuis un fichier JSON
ipcMain.handle('import-data', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Importer des données',
    filters: [
      { name: 'Fichiers JSON', extensions: ['json'] }
    ],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const data = fs.readFileSync(filePaths[0], 'utf-8');
      return { success: true, data: JSON.parse(data) };
    } catch (err) {
      return { success: false, message: `Erreur: ${err.message}` };
    }
  }
  return { success: false, message: 'Importation annulée' };
});

// Sauvegarder les données dans le stockage local
ipcMain.handle('save-library', (event, library, nextId) => {
  try {
    store.set('pyreneenneLibrary', library);
    store.set('pyreneenneNextId', nextId);
    return { success: true };
  } catch (err) {
    return { success: false, message: `Erreur de sauvegarde: ${err.message}` };
  }
});

// Charger les données depuis le stockage local
ipcMain.handle('load-library', () => {
  try {
    return {
      library: store.get('pyreneenneLibrary', []),
      nextId: store.get('pyreneenneNextId', 1)
    };
  } catch (err) {
    return {
      library: [],
      nextId: 1,
      error: `Erreur de chargement: ${err.message}`
    };
  }
});

// Gérer l'ouverture d'un fichier image
ipcMain.handle('select-image', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Sélectionner une image',
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
    ],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const imageData = fs.readFileSync(filePaths[0]);
      const ext = path.extname(filePaths[0]).substring(1).toLowerCase();
      return {
        success: true,
        data: `data:image/${ext};base64,${imageData.toString('base64')}`
      };
    } catch (err) {
      return { success: false, message: `Erreur: ${err.message}` };
    }
  }
  return { success: false, message: 'Sélection annulée' };
});

// === INTÉGRATION GITHUB ===

// Authentification GitHub
ipcMain.handle('github-auth', async (event, token) => {
  try {
    store.set('githubToken', token);
    return { success: true };
  } catch (err) {
    return { success: false, message: `Erreur d'authentification: ${err.message}` };
  }
});

// Sauvegarder sur GitHub
ipcMain.handle('github-save', async (event, data) => {
  const GitHubIntegration = require('./src/github-integration');
  const token = store.get('githubToken');
  
  if (!token) {
    return { success: false, message: 'Token GitHub non configuré' };
  }
  
  try {
    const github = new GitHubIntegration(token);
    const result = await github.saveDataToRepo(data);
    return { success: true, message: 'Données sauvegardées sur GitHub', url: result.url };
  } catch (err) {
    return { success: false, message: `Erreur GitHub: ${err.message}` };
  }
});

// Charger depuis GitHub
ipcMain.handle('github-load', async () => {
  const GitHubIntegration = require('./src/github-integration');
  const token = store.get('githubToken');
  
  if (!token) {
    return { success: false, message: 'Token GitHub non configuré' };
  }
  
  try {
    const github = new GitHubIntegration(token);
    const data = await github.loadDataFromRepo();
    return { success: true, data };
  } catch (err) {
    return { success: false, message: `Erreur GitHub: ${err.message}` };
  }
});

// Vérifier le token GitHub
ipcMain.handle('github-check-token', async () => {
  const token = store.get('githubToken');
  return { hasToken: !!token };
});
  app.on('activate', function () {
    // Sur macOS, il est commun de re-créer une fenêtre dans l'application
    if (mainWindow === null) createWindow();
  });

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// === GESTION DES ÉVÉNEMENTS IPC ===

// Exporter les données dans un fichier JSON
ipcMain.handle('export-data', async (event, data) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exporter les données',
    defaultPath: `bibliotheque-pyreneenne_${new Date().toISOString().split('T')[0]}.json`,
    filters: [
      { name: 'Fichiers JSON', extensions: ['json'] }
    ]
  });

  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, message: 'Exportation réussie' };
    } catch (err) {
      return { success: false, message: `Erreur: ${err.message}` };
    }
  }
  return { success: false, message: 'Exportation annulée' };
});

// Importer des données depuis un fichier JSON
ipcMain.handle('import-data', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Importer des données',
    filters: [
      { name: 'Fichiers JSON', extensions: ['json'] }
    ],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const data = fs.readFileSync(filePaths[0], 'utf-8');
      return { success: true, data: JSON.parse(data) };
    } catch (err) {
      return { success: false, message: `Erreur: ${err.message}` };
    }
  }
  return { success: false, message: 'Importation annulée' };
});

// Sauvegarder les données dans le stockage local
ipcMain.handle('save-library', (event, library, nextId) => {
  try {
    store.set('pyreneenneLibrary', library);
    store.set('pyreneenneNextId', nextId);
    return { success: true };
  } catch (err) {
    return { success: false, message: `Erreur de sauvegarde: ${err.message}` };
  }
});

// Charger les données depuis le stockage local
ipcMain.handle('load-library', () => {
  try {
    return {
      library: store.get('pyreneenneLibrary', []),
      nextId: store.get('pyreneenneNextId', 1)
    };
  } catch (err) {
    return {
      library: [],
      nextId: 1,
      error: `Erreur de chargement: ${err.message}`
    };
  }
});

// Gérer l'ouverture d'un fichier image
ipcMain.handle('select-image', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Sélectionner une image',
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
    ],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const imageData = fs.readFileSync(filePaths[0]);
      const ext = path.extname(filePaths[0]).substring(1).toLowerCase();
      return {
        success: true,
        data: `data:image/${ext};base64,${imageData.toString('base64')}`
      };
    } catch (err) {
      return { success: false, message: `Erreur: ${err.message}` };
    }
  }
  return { success: false, message: 'Sélection annulée' };
});

// === INTÉGRATION GITHUB ===

// Authentification GitHub
ipcMain.handle('github-auth', async (event, token) => {
  try {
    store.set('githubToken', token);
    return { success: true };
  } catch (err) {
    return { success: false, message: `Erreur d'authentification: ${err.message}` };
  }
});

// Sauvegarder sur GitHub
ipcMain.handle('github-save', async (event, data) => {
  const GitHubIntegration = require('./src/github-integration');
  const token = store.get('githubToken');
  
  if (!token) {
    return { success: false, message: 'Token GitHub non configuré' };
  }
  
  try {
    const github = new GitHubIntegration(token);
    const result = await github.saveDataToRepo(data);
    return { success: true, message: 'Données sauvegardées sur GitHub', url: result.url };
  } catch (err) {
    return { success: false, message: `Erreur GitHub: ${err.message}` };
  }
});

// Charger depuis GitHub
ipcMain.handle('github-load', async () => {
  const GitHubIntegration = require('./src/github-integration');
  const token = store.get('githubToken');
  
  if (!token) {
    return { success: false, message: 'Token GitHub non configuré' };
  }
  
  try {
    const github = new GitHubIntegration(token);
    const data = await github.loadDataFromRepo();
    return { success: true, data };
  } catch (err) {
    return { success: false, message: `Erreur GitHub: ${err.message}` };
  }
});

// Vérifier le token GitHub
ipcMain.handle('github-check-token', async () => {
  const token = store.get('githubToken');
  return { hasToken: !!token };
});
