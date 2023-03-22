// Require the necessary modules
const { app, BrowserWindow, dialog } = require('electron'); // Electron modules
const sdk = require("microsoft-cognitiveservices-speech-sdk"); // Microsoft Speech SDK
const ipcMain = require('electron').ipcMain; // Inter-process communication
const path = require('path'); // Path module
const fs = require('fs'); // File System module
const iconPath = path.join(__dirname, 'icon2.png');

if (require('electron-squirrel-startup')) app.quit();

// Set a default folder for saving audio files
let lastUsedFolder = app.getPath('desktop');

// Load environment variables from a .env file
require('dotenv').config();

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    icon: iconPath,
    width: 1000,
    height: 1300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
      
    }
  });

  // Load the index.html
  mainWindow.loadFile('index.html');

  // When the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// IPC listener for the synthesize event
ipcMain.on('synthesize', (event, text, voiceName, pitch, rate) => {
  const ssml = `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="nb-NO">
    <voice name="${voiceName}">
      <prosody pitch="${pitch}%" rate="${rate}">
        ${text}
      </prosody>
    </voice>
  </speak>`;

  const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
  speechConfig.speechSynthesisVoiceName = voiceName;
  var synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  synthesizer.speakSsmlAsync(ssml,
    function (result) {
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        console.log("Synthesis finished.");
        const audioData = result.audioData;
        mainWindow.webContents.send('synthesize:done', audioData);
      } else {
        console.error("Speech synthesis canceled, " + result.errorDetails +
          "\nDid you set the speech resource key and region values?");
      }
      synthesizer.close();
      synthesizer = null;
    },
    function (err) {
      console.trace("err - " + err);
      synthesizer.close();
      synthesizer = null;
    });
  console.log("Now synthesizing...");
});

// Function to save the audio file
function saveAudioFile(audioData) {
  // Check if audioData is not null
  if (!audioData) {
    console.error('Audio data is null, cannot save the file.');
    return;
  }

  // Generate a date stamp string
  const date = new Date();
  const dateStamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;

  dialog.showSaveDialog(mainWindow, {
    title: 'Save Audio File',
    defaultPath: `output_${dateStamp}.wav`,
    filters: [{ name: 'Audio Files', extensions:
    ['wav'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, Buffer.from(audioData));
      console.log('File saved:', result.filePath);
    }
  }).catch(err => {
    console.error(err);
  });
}

// IPC listener to save the audio file
ipcMain.on('save-audio-file', (event, audioData) => {
  saveAudioFile(audioData);
});

// When ready, create the main window
app.on('ready', function () {
  createWindow();
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// When the app is activated create the main window if it doesn't exist
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

//    .    .o88o. oooo                                    .o8                                 
//  .o8    888 `" `888                                   "888                                 
//  .o888oo o888oo   888  oooo  oooo oooo    ooo  .ooooo.   888oooo.      ooo. .oo.    .ooooo.  
//    888    888     888 .8P'    `88. `88.  .8'  d88' `88b  d88' `88b     `888P"Y88b  d88' `88b 
//    888    888     888888.      `88..]88..8'   888ooo888  888   888      888   888  888   888 
//    888 .  888     888 `88b.     `888'`888'    888    .o  888   888 .o.  888   888  888   888 
//    "888" o888o   o888o o888o     `8'  `8'     `Y8bod8P'  `Y8bod8P' Y8P o888o o888o `Y8bod8P' 
                                                                                              
                                                                                              
                                                                                              