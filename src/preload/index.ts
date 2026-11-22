import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  //Closes the window
  closeWindow (): void {
    ipcRenderer.send("closeWindow");
  },

  showSubTextScreen() : void {
    ipcRenderer.send("showSubTextScreen")
  },
  
  sendText(message : string) : void {
    ipcRenderer.send("sendText", message)
  },

  onRetrieveText: (callback: (text: string) => void) => {
      ipcRenderer.on("retrieveText", (_, text) => {
        callback(text);
      });
  },
  backToMainScreen: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("backToMainScreen", () => {
      listener();
    });
    
    return () => {
      ipcRenderer.removeListener("backToMainScreen", listener);
    };
  },

  //Edits the language
  changeLanguages (lan1 : string, lan2: string): void {
    ipcRenderer.send("changeLanguages", lan1, lan2);
  },

  //Read the language
  readLanguages() : Promise<string> {
    return ipcRenderer.invoke("readLanguages");
  },

  //Gets the camera version
  getCameraVersion() : Promise<string> {
    return ipcRenderer.invoke("getCameraVersion");
  },

  //Screen size
  screenSize() : Promise<JSON> {
    return ipcRenderer.invoke("screenSize");
  },

  //Returns the text that the text reads
  getTextResults(text : string, lan1 : string, lan2 : string) : Promise<String>
  {
    return ipcRenderer.invoke("getTextResults", text, lan1, lan2);
  },

  //Returns the text that the screen reads
  getTextImageResults(image : ArrayBuffer, lan : string, lan2 : string) : Promise<string> {
    return ipcRenderer.invoke('getTextImageResults', image, lan, lan2);
  },

  //Doc for translation
  getDocxForTranslation(file : ArrayBuffer, lan : string, lan2 : string) : Promise<File> {
    return ipcRenderer.invoke("getDocxForTranslation", file, lan, lan2);
  },

  //PDF for translation
  getPdfForTranslation(file : ArrayBuffer, lan : string, lan2 : string) : Promise<File> {
    return ipcRenderer.invoke("getPdfForTranslation", file, lan, lan2);
  },

  //PDF for translation
  getImgForTranslation(file : ArrayBuffer, lan : string, lan2 : string, type_of_image: string) : Promise<File> {
    return ipcRenderer.invoke("getImgForTranslation", file, lan, lan2, type_of_image);
  },

  //PDF for translation
  getWavForTranslation(file : ArrayBuffer, lan : string, lan2 : string) : Promise<File> {
    return ipcRenderer.invoke("getWavForTranslation", file, lan, lan2);
  },

  //Send quality string
  qualitySettings(quality: string){
    ipcRenderer.send("qualitySettings", quality)
  },

  //Grammar Settings
  grammarSettings(grammar: boolean)
  {
    ipcRenderer.send("grammarSettings", grammar)
  },

  //Back to home
  backToHome()
  {
    ipcRenderer.send("backToHome");
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
