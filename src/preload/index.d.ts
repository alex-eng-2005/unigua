import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  closeWindow(): void;
  showSubTextScreen() : void;
  sendText(message : string) : void;
  onRetrieveText(callback: (text: string) => void): void
  changeLanguages(lan1 : string, lan2 : string) : void;
  readLanguages() : Promise<string>;
  screenSize() : Promise<JSON>;
  getCameraVersion() : Promise<string>;
  qualitySettings(quality : string) : Promise<String>;
  getTextResults(image : ArrayBuffer, lan : string, lan2 : string);
  backToHome() : void;
  backToMainScreen(callback: () => void) : void;
}
declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
