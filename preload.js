const { contextBridge, ipcRenderer } = require('electron');

// Exposer des API protégées au processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
  // === GESTION DES FICHIERS ===
  exportData: (data) => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  selectImage: () => ipcRenderer.invoke('select-image'),
  
  // === GESTION DU STOCKAGE LOCAL ===
  saveLibrary: (library, nextId) => ipcRenderer.invoke('save-library', library, nextId),
  loadLibrary: () => ipcRenderer.invoke('load-library'),
  
  // === INTÉGRATION GITHUB ===
  githubAuth: (token) => ipcRenderer.invoke('github-auth', token),
  githubSave: (data) => ipcRenderer.invoke('github-save', data),
  githubLoad: () => ipcRenderer.invoke('github-load'),
  githubCheckToken: () => ipcRenderer.invoke('github-check-token')
});
