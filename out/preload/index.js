"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  //Closes the window
  closeWindow() {
    electron.ipcRenderer.send("closeWindow");
  },
  showSubTextScreen() {
    electron.ipcRenderer.send("showSubTextScreen");
  },
  sendText(message) {
    electron.ipcRenderer.send("sendText", message);
  },
  onRetrieveText: (callback) => {
    electron.ipcRenderer.on("retrieveText", (_, text) => {
      callback(text);
    });
  },
  backToMainScreen: (callback) => {
    const listener = () => callback();
    electron.ipcRenderer.on("backToMainScreen", () => {
      listener();
    });
    return () => {
      electron.ipcRenderer.removeListener("backToMainScreen", listener);
    };
  },
  //Edits the language
  changeLanguages(lan1, lan2) {
    electron.ipcRenderer.send("changeLanguages", lan1, lan2);
  },
  //Read the language
  readLanguages() {
    return electron.ipcRenderer.invoke("readLanguages");
  },
  //Gets the camera version
  getCameraVersion() {
    return electron.ipcRenderer.invoke("getCameraVersion");
  },
  //Screen size
  screenSize() {
    return electron.ipcRenderer.invoke("screenSize");
  },
  //Returns the text that the text reads
  getTextResults(text, lan1, lan2) {
    return electron.ipcRenderer.invoke("getTextResults", text, lan1, lan2);
  },
  //Returns the text that the screen reads
  getTextImageResults(image, lan, lan2) {
    return electron.ipcRenderer.invoke("getTextImageResults", image, lan, lan2);
  },
  //Doc for translation
  getDocxForTranslation(file, lan, lan2) {
    return electron.ipcRenderer.invoke("getDocxForTranslation", file, lan, lan2);
  },
  //PDF for translation
  getPdfForTranslation(file, lan, lan2) {
    return electron.ipcRenderer.invoke("getPdfForTranslation", file, lan, lan2);
  },
  //PDF for translation
  getImgForTranslation(file, lan, lan2, type_of_image) {
    return electron.ipcRenderer.invoke("getImgForTranslation", file, lan, lan2, type_of_image);
  },
  //PDF for translation
  getWavForTranslation(file, lan, lan2) {
    return electron.ipcRenderer.invoke("getWavForTranslation", file, lan, lan2);
  },
  //Send quality string
  qualitySettings(quality) {
    electron.ipcRenderer.send("qualitySettings", quality);
  },
  //Grammar Settings
  grammarSettings(grammar) {
    electron.ipcRenderer.send("grammarSettings", grammar);
  },
  //Back to home
  backToHome() {
    electron.ipcRenderer.send("backToHome");
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
