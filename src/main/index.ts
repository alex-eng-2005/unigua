import { app, BrowserWindow, screen, session, ipcMain, desktopCapturer } from 'electron'
import {promises as fs} from "fs";
import { join } from 'path'
import editLanguages from './Data/editLanguages';
let subWindow: BrowserWindow | null = null;
let win : BrowserWindow | null = null
let quality : string = "Fast";
let grammar : boolean = false;

function createWindow() : void {
  //Creates the session
  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      //Tells the desktop that it wants to look
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
      });

      //Automatically captures the first monitor
      callback({
        video: sources[0],
      });
    }
  )
  //Creates the window
   win = new BrowserWindow({
    width: 600,
    height: 600,
    frame: false,
    transparent: true,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: true
    }
  })
  //win?.webContents.openDevTools();

  win?.setAlwaysOnTop(true);
  //Loads the file
  win.loadFile(join(__dirname, "../renderer/index.html"));
 
  //win.webContents.toggleDevTools();
  ipcMain.handle("screenSize", async(_event)=>{
    if (!win) return
    const windowBounds = win.getContentBounds();
    const currentDisplay = screen.getDisplayMatching(windowBounds);

    const json = {
      "screenWidth": currentDisplay.bounds.width,
      "screenHeight": currentDisplay.bounds.height,
      "screenX": currentDisplay.bounds.x,
      "screenY": currentDisplay.bounds.y,
      "windowX": windowBounds.x,
      "windowY": windowBounds.y,
      "windowWidth": windowBounds.width,
      "windowHeight": windowBounds.height,
    }
    return json;
  })

}

ipcMain.on("showSubTextScreen", ()=>{
    //Subtitle window
  subWindow = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  })
subWindow?.setAlwaysOnTop(true);
subWindow.loadFile(join(__dirname,  "../renderer/index.html"), {hash: "/SeperateText"});
  //subWindow.webContents.openDevTools();
  subWindow.on("closed", ()=>{
    subWindow = null;
  })
})

//Sends the text
ipcMain.on("sendText", (_event, message : string)=> {
  subWindow?.webContents.send("retrieveText", message)
})

//Quality Settings
ipcMain.on("qualitySettings", (_event, q : string)=>{
  quality = q;
})

//Grammar settings
ipcMain.on("grammarSettings", (_event, g : boolean)=>{
  grammar = g;
})

//Closes the window
ipcMain.on("closeWindow", (event)=>{
    BrowserWindow.fromWebContents(event.sender)?.close();
})

//Changes the language
ipcMain.on("changeLanguages", async (_event, lan1 : string, lan2 : string)=>{
  await editLanguages(lan1, lan2);
})

//Reads the language
ipcMain.handle("readLanguages", async(_event)=>{
  const file = await fs.readFile("src/main/Data/languages.json", "utf8");
  return JSON.parse(file);
})

//Gets the camera version
ipcMain.handle("getCameraVersion", async(_event)=>{
  const file = await fs.readFile("src/main/Data/SubScanSettings.json", "utf8");
  const getSettings = JSON.parse(file);
  return getSettings["type_of_lens"];
})

//Gets the text results
ipcMain.handle("getTextResults", async(_event, text : string, lan1 : string, lan2 : string)=>{
  try
  {
    //Gets the data type
    const formData = new FormData();
    //Appends the data
    formData.append("text", text);
    formData.append("lan1", lan1);
    formData.append("lan2", lan2);

    //Gets the translated language
    const response = await fetch("http://localhost:8000/getTextResult", {
      method: "POST",
      body: formData
    })

    //Checks if their was any issues
    if(!response.ok)
    {
      throw new Error(await response.text());
    }
    else
    {
      //Returns the translated text
      const data = await response.json();
      return data["results"];
    }
  }
  catch(err)
  {
    console.log(err);
    return undefined;
  }
})


ipcMain.handle("getTextImageResults", async(_event, image : ArrayBuffer, lan1 : string, lan2 : string)=>{
  try
  {
    
    //Gets the data type
    const formData = new FormData();
    const newImage = new Blob([image], {"type": "image/png"});

    //Quality
    formData.append("image", newImage, "screenshot.png");
    formData.append("lan1", lan1);
    formData.append("lan2", lan2);
    formData.append("quality", quality);
    formData.append("grammar", String(grammar));

    //Loading Screen
    subWindow?.webContents.send("retrieveText", ".....")
    //Gets the response
    const response = await fetch("http://localhost:8000/determine", {
      method: "POST",
      body: formData
    });

    if(!response.ok)
    {
      throw new Error(await response.text());
    }
    else
    {
      //Returns the translated text
      const data = await response.json();
      return data["results"];
    }
  }
  catch(err)
  {
    console.log(err);
    return undefined;
  }
})

ipcMain.handle("getDocxForTranslation", async(_event, file : ArrayBuffer, lan1 : string, lan2 : string)=>{
  try
  {
    
    //Gets the data type
    const formData = new FormData();
    const getDocOrDocx = new Blob([file], {"type": 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    //Sets the form
    formData.append("file_data", getDocOrDocx, "document.docx");
    formData.append("lan1", lan1);
    formData.append("lan2", lan2);

    //Gets the response
    const response = await fetch("http://localhost:8000/docxTranslation", {
      method: "POST",
      body: formData
    });

    if(!response.ok)
    {
      throw new Error(await response.text());
    }
    else
    {
      
      //Returns the arrayBuffer 
      return await response.arrayBuffer();
    }
  }
  catch(err)
  {
    console.log(err);
    return undefined
  }
})


ipcMain.handle("getPdfForTranslation", async(_event, file : ArrayBuffer, lan1 : string, lan2 : string)=>{
  try
  {
    
    //Gets the data type
    const formData = new FormData();
    const getDocOrDocx = new Blob([file], {"type": 'application/pdf'});
    //Sets the form
    formData.append("file_data", getDocOrDocx, "document.pdf");
    formData.append("lan1", lan1);
    formData.append("lan2", lan2);

    //Gets the response
    const response = await fetch("http://localhost:8000/pdfTranslation", {
      method: "POST",
      body: formData
    });

    if(!response.ok)
    {
      throw new Error(await response.text());
    }
    else
    {
      
      //Returns the arrayBuffer 
      return await response.arrayBuffer();
    }
  }
  catch(err)
  {
    console.log(err);
    return undefined
  }
})



ipcMain.on("backToHome", async(_event)=>{
  win?.webContents.send("backToMainScreen");
  //win?.loadFile(join(__dirname,  "../renderer/index.html"), {hash: "/Home"});
  subWindow?.close();
})



app.whenReady().then(() => createWindow());