const {default: axios} = require('axios');
const { app, BrowserWindow, Tray, Menu , ipcMain, shell, nativeImage} = require('electron');
const path = require('path');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const promisedFS = require('fs').promises;
const moment = require('moment');

let tray = null;
let dailyRefreshEnabled = false;
let win = null;
let imageBasePath = "";
let imageList = [];
let settingsFile = "bingWallpaperSettings.json";
let bingSettings = {};

const bingSettingsClicked = () => {
    createWindow();
}

const createSettingsFile = async() => {
    try {
        bingSettings = {
            "isDailyRefreshEnabled": false,
            "lastModified": moment().format('DD-MMM-YYYY'),
            "imageArray": []
        }
    
        let stringifiedSettingsObject = JSON.stringify(bingSettings);
    
        let settingsFilePath = imageBasePath + "/" + settingsFile
    
        await promisedFS.writeFile(settingsFilePath, stringifiedSettingsObject)
        console.log('settings file created');
    } catch (error) {
        console.log("createSettingsFile catch error : ", error)
    }
}

const readSettingsFile = async() => {
    try {
        let settingsFilePath = imageBasePath + "/" + settingsFile
        const data = await promisedFS.readFile(settingsFilePath)
            
        bingSettings = JSON.parse(data)
        console.log(`got data from ${settingsFile} : `,JSON.parse(data))
    } catch (error) {
        bingSettings = {}
        console.log("readSettingsFile catch error : ", error)
    }

    return bingSettings
}

const createOrGetImageBasePath = async() => {
    try {
        const {stdout: stdOutput, stderr: stdError} = await exec('echo $HOME/Documents/BingWallpaper')
        if (stdError) {
            console.log(`stderr: ${stdError}`);
            return;
        }
        
        imageBasePath = stdOutput.substring(0, stdOutput.length - 1);
        let command1 = 'ls ' + imageBasePath

        const {stdout: stdOutput2, stderr: stdError2} = await exec(command1)
        
        if (stdError2) {
            console.log(`stderr2: ${stdError2}`);
            return;
        }

        bingSettings = await readSettingsFile();

        dailyRefreshEnabled = bingSettings.isDailyRefreshEnabled
    } catch (error) {
        console.log("createOrGetImageBasePath catch error: ",error.message)
        
        if(error.message.includes("Command failed: ls")){
            let command2 = 'mkdir ' + imageBasePath
            const {stdout: stdOutput3, stderr: stdError3} = await exec(command2)

            if(stdError3){
                console.log("createOrGetImageBasePath catch error stdError : ", stdError3)
                return
            }
            else{
                createSettingsFile();                        
                console.log("createOrGetImageBasePath Directory created : ", imageBasePath)
            }
        }
        else if(error.message.includes("ENOENT: no such file or directory")){
            console.log(`${settingsFile} file not found`);
            createSettingsFile()
        }
    }
}

const clearAllPreviousImages = async() => {
    try {
        bingSettings = await readSettingsFile();

        if((bingSettings.imageArray.length === 0) || (bingSettings.lastModified !== moment().format('DD-MMM-YYYY'))){
            const files = await promisedFS.readdir(imageBasePath)
            files && files.length > 0 && files.forEach(async(file) => {
                if(file.toString() !== settingsFile){
                    await promisedFS.unlink(`${imageBasePath}/${file.toString()}`)
                }
            });
        }
    } catch (error) {
        console.log("clearAllPreviousImages catch error : ", error)
    }
}

const getBingImages = async() => {
    let imgResults = []

    try {
        bingSettings = await readSettingsFile();

        if((bingSettings.imageArray.length === 0) || (bingSettings.lastModified !== moment().format('DD-MMM-YYYY'))){
            let imagesData = await axios.get('https://go.microsoft.com/fwlink/?linkid=2151983&screenWidth=1366&screenHeight=768&env=live');
        
            if(imagesData.status === 200 && imagesData.data.images.length > 0){
                imgResults = JSON.parse(JSON.stringify(imagesData.data.images))
                bingSettings = await cacheImageApiData(bingSettings, imgResults)

                imagesData.data.images.forEach(image => {
                    download_image(image.url, `${imageBasePath}/${image.startdate}.jpg`)
                })

                imgResults.sort((a,b) => a.startdate - b.startdate)
                setWallpaper(imageBasePath, imgResults[imgResults.length - 1].startdate)
            }
        }
        else{
            imgResults = JSON.parse(JSON.stringify(bingSettings.imageArray))
            imgResults.sort((a,b) => a.startdate - b.startdate)
        }
    } catch (error) {
        console.error("getBingImages catch error : ", error)
        imgResults = []
    }

    return imgResults;
}

const download_image = (url, image_path) =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on('finish', () => resolve())
          .on('error', e => reject(e));
      }),
  )
  .catch((errorReason) => {
      console.log("download_image catch Error : ", errorReason)
  });

const setWallpaper = async(imageBasePath, filename) => {
    try {
        let fileProtocol = `file:///${imageBasePath}/${filename}.jpg`
        let command = 'gsettings set org.gnome.desktop.background picture-uri ' + fileProtocol
        const {stdout, stderr} = await exec(command)
        console.log(`stdout: wallpaper set`);
    } catch (error) {
        console.log("setWallpaper catch error : ", error)
    }
}

const cacheImageApiData = async(bingSettings, imgArray) => {
    try {
        bingSettings.lastModified = moment().format('DD-MMM-YYYY')
        bingSettings.imageArray = imgArray

        let settingsFilePath = imageBasePath + "/" + settingsFile
        let stringifiedSettingsObject = JSON.stringify(bingSettings);

        await promisedFS.writeFile(settingsFilePath, stringifiedSettingsObject)
            
        console.log('api cached');
    } catch (error) {
        bingSettings = {}
        console.log("cacheImageApiData catch error : ", error)
    }

    return bingSettings
}

const changeDailyRefreshOption = async(checked) => {
    try {
        bingSettings = await readSettingsFile();

        bingSettings.isDailyRefreshEnabled = checked
        dailyRefreshEnabled = checked

        let settingsFilePath = imageBasePath + "/" + settingsFile
        let stringifiedSettingsObject = JSON.stringify(bingSettings);

        await promisedFS.writeFile(settingsFilePath, stringifiedSettingsObject)
            
        console.log('updation done');
    } catch (error) {
        console.log("changeDailyRefreshOption catch error : ", error)
    }
}

const createTray = () => {
    let icon = nativeImage.createFromPath('assets/bing16x16.png')
    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
        { label: `Daily refresh is ${dailyRefreshEnabled ? "on" : "off"}`, type: 'normal', enabled: false },
        { type: 'separator' },
        { label: 'Bing Wallpaper Settings', type: 'normal', click: bingSettingsClicked}
    ])
    tray.setContextMenu(contextMenu)
}

let proms = [createOrGetImageBasePath, createTray, clearAllPreviousImages, getBingImages] // createOrGetImageBasePath, clearAllPreviousImages, getBingImages

const programExecutionSteps = async() => {
    try {
        for (let promise of proms) {
            if(promise.name === "getBingImages"){
                imageList = await promise();
            }
            else{
                await promise();
            }
        }
    } catch (error) {
        console.log("program execution catch error : ", error)
    }
}

const createWindow = () => {
    win = new BrowserWindow({
        center: true,
        simpleFullscreen: true,
        icon: 'assets/bing128x128.png',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            worldSafeExecuteJavascript: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.setMenuBarVisibility(false);
    win.loadFile('public/index.html')
    // win.webContents.openDevTools();
}

if(!app.isPackaged){
    require('electron-reload')(__dirname, {
        electron: 'node_modules/.bin/electron'
    })
}

app.enableSandbox();

// Entry Point to app
app.whenReady().then(() => {
    programExecutionSteps()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit()
})

ipcMain.on('browserurl', (_, url) => {
    shell.openExternal(url)
})

ipcMain.on('tray', (_, isEnabled) => {
    changeDailyRefreshOption(isEnabled)
    dailyRefreshEnabled = isEnabled
    const contextMenu = Menu.buildFromTemplate([
        { label: `Daily refresh is ${dailyRefreshEnabled ? "on" : "off"}`, type: 'normal', enabled: false },
        { type: 'separator' },
        { label: 'Bing Wallpaper Settings', type: 'normal', click: bingSettingsClicked}
    ])
    tray.setContextMenu(contextMenu)
})

ipcMain.on('setWallpaper', (_, imageBasePath, imagefile) => {
    setWallpaper(imageBasePath, imagefile)
})




ipcMain.handle('importImage', async(event, filepath) => {
    const byteArray = await promisedFS.readFile(filepath)
    return Buffer.from(byteArray).toString('base64');
})

ipcMain.handle('getData', async(event, data) => {
    try {
        imageList = await imageList;
    } catch (error) {
        console.log("invoke error : ", error)
    }
    return JSON.parse(JSON.stringify({"isDailyRefreshEnabled": dailyRefreshEnabled, imageBasePath, imageList}))
})

