import type { BrowserWindow } from "electron";

export interface WindowParent {
  mainWindow: BrowserWindow;
}

declare global {
  interface Window extends WindowParent {}
}
