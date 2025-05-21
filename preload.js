const { contextBridge, ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

contextBridge.exposeInMainWorld('electronAPI', {
  exportData: (data) => ipcRenderer.invoke('export-data', data)
});
