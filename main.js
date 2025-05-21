const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

ipcMain.handle('export-data', async (_, data) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Exporter les données',
        defaultPath: path.join(app.getPath('documents'), 'bibliotheque_pyreneenne.json'),
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
        await fs.promises.writeFile(filePath, data);
        return { success: true, filePath };
    }
    return { success: false };
});


let mainWindow;

ipcMain.handle('export-data', async (event, data) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Exporter les données',
        defaultPath: path.join(app.getPath('documents'), 'bibliotheque_pyreneenne.json'),
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePath) {
        await fs.promises.writeFile(filePath, data);
        return { filePath };
    }
    return {};
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
