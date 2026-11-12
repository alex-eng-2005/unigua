import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  closeWindow(): void; //Closes the window
  showSubTextScreen() : void; //Shows the subtext screen
  backToHome() : void; //Goes back to home
  backToMainScreen(callback: () => void) : void; //Goes back to the main screen
  sendText(message : string) : void;  //Sends the text back to the output screen for the scanner mode
  onRetrieveText(callback: (text: string) => void): void //Retrieves the text from the scanner
  changeLanguages(lan1 : string, lan2 : string) : void; //Changes the languages in the settings to what the user wants
  readLanguages() : Promise<string>; //Reads the languages
  screenSize() : Promise<JSON>; //Gets the screen size for accurate readings for image
  getCameraVersion() : Promise<string>; //Not used anymore
  qualitySettings(quality : string) : Promise<String>; //Goes to the ai server to show it what quality settings the user wants for the image
  grammarSettings(grammar : boolean) : Promise<String>; //Confirms for the camera screen if the user wants the grammar version
  getTextResults(text : string, lan : string, lan2 : string); //Sends the text to the ai translator
  getTextImageResults(image : ArrayBuffer, lan : string, lan2 : string); //Sends the image to the ai translator
  getDocxForTranslation(file : ArrayBuffer, lan : string, lan2 : string); //Sends the docx file to the ai translator
  getPdfForTranslation(file : ArrayBuffer, lan : string, lan2 : string); //Sends the docx file to the ai translator
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
