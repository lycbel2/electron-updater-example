"use strict";
const Promise = require('bluebird');
const { CancellationToken } = require("electron-builder-http");
const storage = require('electron-json-storage');
Promise.promisifyAll(storage);
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");
const autoUpdateString = "autoUpdatString_random_olapxsdf#@%";
const errorUpdaterInvalid = 'errorUpdaterInvalid';
const {ipcMain} = require('electron');
const UpdaterFactory = (function() {
  let instance = null;
  class Updater
  {
    constructor(window, app) {
      if (!window && app) {
        throw ('updater need two paras');
        return null;
      }
      this.menuallyStarted = false;
      this.autoInstallAfterDownload = false;
      this.autoUpdateModuleOkay = null;
      this.cancellationToken = new CancellationToken()
      this.hasUpdate = null;
      //check if auto updater module available
      if (autoUpdater) {
        this.autoUpdateModuleOkay = true;
      } else {
        this.autoUpdateModuleOkay = false;
      }
      this.win = window;
      this.app = app;
      this.autoCheckUpdate = null;
      setAutoUpdater(); //config the updater
    }
    onStart() {
      return new Promise((resolve, reject) => {
        storage.getAsync(autoUpdateString).then((data, err) => {
          if (isAutoCheck(err, data)) {
            if (this.autoUpdateModuleOkay) {
              resolve(this.startUpdateJob());
            } else {
              reject('update module available');
            }
          } else {
            resolve(null);
          }
        })
      })
    }
    onClose() {
      storage.setAsync(autoUpdateString, this.autoCheckUpdate).then(null);
    }
    startUpdateManually() {
      return new Promise((resolve, reject) => {
        this.startUpdateManually = true;
        resolve(this.startUpdateJob())
      })
    }
    cancelUpdate() {
      return autoUpdater.downloadUpdate(this.cancellationToken); //return promise
    }
    enableAutoCheck() {
      this.autoCheckUpdate = true;
    }
    disableAutoCheck() {
      this.autoCheckUpdate = false;
    }


    startUpdateJob() {
      if (!this.autoUpdateModuleOkay) {
        return null;
      }
      const backObj = this;
      autoUpdater.logger = log;
      autoUpdater.logger.transports.file.level = 'info';
      this.registerMessageHandlerForUpdater(backObj);
      this.registerMessageHandlerForIPCMain(backObj);
      return autoUpdater.checkForUpdates();
    }

    sendStatusToWindow(text) {
    this.win.webContents.send('message', text);
  }
  registerMessageHandlerForUpdater(backObj){

    autoUpdater.on('checking-for-update', () => {
      console.log('check update');
      this.sendStatusToWindow('Checking for update...');
    })
    autoUpdater.on('update-available', (info) => {
      backObj.hasUpdate = true;
      this.sendStatusToWindow(JSON.stringify(info) + 'Update available.');
    })
    autoUpdater.on('update-not-available', (info) => {
      backObj.hasUpdate = false;
      this.sendStatusToWindow('Update not available.');
    })
    autoUpdater.on('error', (err) => {
      this.sendStatusToWindow('Error in auto-updater. ' + err);
    })
    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = "Download speed: " + progressObj.bytesPerSecond;
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
      log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
      this.sendStatusToWindow(log_message);
    })
    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindow('Update downloaded');
      autoUpdater.quitAndInstall(true, true)
    });
  }
  registerMessageHandlerForIPCMain(backObj){
    ipcMain.on('cancel-update', (event, arg)=> {

    })
    ipcMain.on('auto-check-update-set', (event, arg)=> { //arg true/false

    })
    ipcMain.on('quit-install-now', (event, arg)=> { //arg true/false

    })

  }
  }

  return {
    getInstance(win, app) {
      if (instance) {
        if (win && app) {
          instance.app = app;
          instance.win = win;
        }
        return instance;
      } else {
        instance = new Updater(win, app);
        return instance;
      }
    }
  };


})();

function setAutoUpdater(){
  autoUpdater.autoDownload = true;  // when the update is available, it will download automatically
  autoUpdater.autoInstallOnAppQuit = true; // if user does not install downloaded app, it will auto install when quit the app
  autoUpdater.allowDowngrade = false;
}

function isUndefined(object){
  return typeof object != 'undefined';
}

function  isAutoCheck(err,data){
  if(err){
  }else{
    //if it is undefined by default it will auto check update
    if(data == true || isUndefined(data)){
      return true;
    }
  }
  return false;
}

exports.Updater = UpdaterFactory;




