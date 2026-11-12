"use strict";
const electron = require("electron");
const fs = require("fs");
const path = require("path");
async function editLanguages(lan1, lan2) {
  const filePath = path.join(__dirname, "../../src/main/Data/languages.json");
  try {
    const rawData = await fs.promises.readFile(filePath, "utf8");
    const data = JSON.parse(rawData);
    data.lan1 = lan1;
    data.lan2 = lan2;
    const updateJSON = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(filePath, updateJSON);
  } catch (error) {
    console.error("Failed to update");
  }
}
let subWindow = null;
let win = null;
let quality = "Fast";
let grammar = false;
function createWindow() {
  electron.session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      const sources = await electron.desktopCapturer.getSources({
        types: ["screen"]
      });
      callback({
        video: sources[0]
      });
    }
  );
  win = new electron.BrowserWindow({
    width: 600,
    height: 600,
    frame: false,
    transparent: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: true
    }
  });
  win?.setAlwaysOnTop(true);
  win.loadFile(path.join(__dirname, "../renderer/index.html"));
  electron.ipcMain.handle("screenSize", async (_event) => {
    if (!win) return;
    const windowBounds = win.getContentBounds();
    const currentDisplay = electron.screen.getDisplayMatching(windowBounds);
    const json = {
      "screenWidth": currentDisplay.bounds.width,
      "screenHeight": currentDisplay.bounds.height,
      "screenX": currentDisplay.bounds.x,
      "screenY": currentDisplay.bounds.y,
      "windowX": windowBounds.x,
      "windowY": windowBounds.y,
      "windowWidth": windowBounds.width,
      "windowHeight": windowBounds.height
    };
    return json;
  });
}
electron.ipcMain.on("showSubTextScreen", () => {
  subWindow = new electron.BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  subWindow?.setAlwaysOnTop(true);
  subWindow.loadFile(path.join(__dirname, "../renderer/index.html"), { hash: "/SeperateText" });
  subWindow.on("closed", () => {
    subWindow = null;
  });
});
electron.ipcMain.on("sendText", (_event, message) => {
  subWindow?.webContents.send("retrieveText", message);
});
electron.ipcMain.on("qualitySettings", (_event, q) => {
  quality = q;
});
electron.ipcMain.on("grammarSettings", (_event, g) => {
  grammar = g;
});
electron.ipcMain.on("closeWindow", (event) => {
  electron.BrowserWindow.fromWebContents(event.sender)?.close();
});
electron.ipcMain.on("changeLanguages", async (_event, lan1, lan2) => {
  await editLanguages(lan1, lan2);
});
electron.ipcMain.handle("readLanguages", async (_event) => {
  const file = await fs.promises.readFile("src/main/Data/languages.json", "utf8");
  return JSON.parse(file);
});
electron.ipcMain.handle("getCameraVersion", async (_event) => {
  const file = await fs.promises.readFile("src/main/Data/SubScanSettings.json", "utf8");
  const getSettings = JSON.parse(file);
  return getSettings["type_of_lens"];
});
electron.ipcMain.handle("getTextResults", async (_event, text, lan1, lan2) => {
  try {
    const formData = new FormData();
    formData.append("text", text);
    formData.append("lan1", lan1);
    formData.append("lan2", lan2);
    const response = await fetch("http://localhost:8000/getTextResult", {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(await response.text());
    } else {
      const data = await response.json();
      return data["results"];
    }
  } catch (err) {
    console.log(err);
    return void 0;
  }
});
electron.ipcMain.handle("getTextImageResults", async (_event, image, lan1, lan2) => {
  try {
    const formData = new FormData();
    const newImage = new Blob([image], { "type": "image/png" });
    formData.append("image", newImage, "screenshot.png");
    formData.append("lan1", lan1);
    formData.append("lan2", lan2);
    formData.append("quality", quality);
    formData.append("grammar", String(grammar));
    subWindow?.webContents.send("retrieveText", ".....");
    const response = await fetch("http://localhost:8000/determine", {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(await response.text());
    } else {
      const data = await response.json();
      return data["results"];
    }
  } catch (err) {
    console.log(err);
    return void 0;
  }
});
electron.ipcMain.handle("getDocxForTranslation", async (_event, file, lan1, lan2) => {
  try {
    const formData = new FormData();
    const getDocOrDocx = new Blob([file], { "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    formData.append("file_data", getDocOrDocx, "document.docx");
    formData.append("lan1", lan1);
    formData.append("lan2", lan2);
    const response = await fetch("http://localhost:8000/docxTranslation", {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(await response.text());
    } else {
      return await response.arrayBuffer();
    }
  } catch (err) {
    console.log(err);
    return void 0;
  }
});
electron.ipcMain.handle("getPdfForTranslation", async (_event, file, lan1, lan2) => {
  try {
    const formData = new FormData();
    const getDocOrDocx = new Blob([file], { "type": "application/pdf" });
    formData.append("file_data", getDocOrDocx, "document.pdf");
    formData.append("lan1", lan1);
    formData.append("lan2", lan2);
    const response = await fetch("http://localhost:8000/pdfTranslation", {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(await response.text());
    } else {
      return await response.arrayBuffer();
    }
  } catch (err) {
    console.log(err);
    return void 0;
  }
});
electron.ipcMain.on("backToHome", async (_event) => {
  win?.webContents.send("backToMainScreen");
  subWindow?.close();
});
electron.app.whenReady().then(() => createWindow());
