import "source-map-support/register";

import { app, BrowserWindow } from "electron";
import install, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if ((await import("electron-squirrel-startup")).default) {
  app.quit();
}

await import("./server");

const createWindow = () => {
  // Create the browser window.

  const mainWindow:BrowserWindow = new BrowserWindow({
    frame: true,
    width: 1293,
    height: 727,
    webPreferences: {
      preload: MAIN_PAGE_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
    fullscreen: false,
    resizable: true,
    title: "727-template", // TODO : replace this with the name of your app
  });

  // @ts-ignore
  global.mainWindow = mainWindow;

  // and load the current page
  mainWindow.loadURL(MAIN_PAGE_WEBPACK_ENTRY);

  // Open the DevTools
  mainWindow.webContents.openDevTools();

  mainWindow.on('close', event=>{
    console.log("preventing default...");
    event.preventDefault(); //this prevents it from closing. The `closed` event will not fire now
    mainWindow.hide();
  })
  
};




app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

process.on("SIGTERM", () => {
  app.exit(0);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
app.whenReady().then(async () => {
  await install(VUEJS3_DEVTOOLS);
  createWindow();
});
