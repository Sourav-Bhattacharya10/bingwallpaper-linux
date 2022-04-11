const { ipcRenderer, contextBridge } = require('electron');
// window.ipcRenderer = require('electron').ipcRenderer;

contextBridge.exposeInMainWorld('electronContextBridge', {
    browserApi: {
        openURLInSystemBrowser: (url) => {
            ipcRenderer.send('browserurl', url);
        }
    },
    trayApi: {
        trayContextMenuStatus: (isEnabled) => {
            ipcRenderer.send('tray', isEnabled);
        }
    },
    reactjsApi: {
        getDataFromMain: (data) => ipcRenderer.invoke('getData', data),
        importImageFile: (filepath) => ipcRenderer.invoke('importImage', filepath),
        setWallpaper: (isDailyRefreshEnabled, imageBasePath, imagefile) => ipcRenderer.send('setWallpaper', isDailyRefreshEnabled, imageBasePath, imagefile),
    }
})